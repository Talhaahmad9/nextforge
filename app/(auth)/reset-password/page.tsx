import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password" };

interface ResetPasswordPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { email } = await searchParams;

  if (!email) redirect("/forgot-password");

  const decoded = decodeURIComponent(email);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Reset your password
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Enter the code we sent and choose a new password.
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
          <ResetPasswordForm email={decoded} />
        </div>
      </div>
    </main>
  );
}
