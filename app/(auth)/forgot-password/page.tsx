import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Forgot your password?
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No worries — we&apos;ll send you a reset code.
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
