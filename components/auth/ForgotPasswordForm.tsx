"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { sendPasswordResetOTPAction } from "@/actions/email";

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    startTransition(async () => {
      const result = await sendPasswordResetOTPAction(formData);
      if (result.success) {
        setSentTo(email);
      } else {
        toast("error", result.error);
      }
    });
  }

  if (sentTo) {
    return (
      <div className="animate-fade-in flex flex-col gap-5 w-full">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-success)] bg-[var(--color-success)]/10 px-4 py-3">
          <p className="text-sm text-[var(--color-foreground)]">
            If that email exists, a code was sent.
          </p>
        </div>

        <Link
          href={`/reset-password?email=${encodeURIComponent(sentTo)}`}
          className="inline-flex items-center justify-center w-full h-10 px-4 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
        >
          Continue to reset
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="animate-fade-in flex flex-col gap-5 w-full"
    >
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Enter your email and we&apos;ll send you a reset code.
      </p>

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        disabled={isPending}
      />

      <Button type="submit" fullWidth isLoading={isPending} loadingText="Sending…" disabled={isPending}>
        Send reset code
      </Button>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Remembered it?{" "}
        <Link href="/login" className="text-[var(--color-primary)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
