"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { verifyEmailAction } from "@/actions/auth";
import { resendVerificationOTPAction } from "@/actions/email";

const RESEND_COOLDOWN = 60;

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  function submit(value: string) {
    const formData = new FormData();
    formData.set("email", email);
    formData.set("otp", value);

    startTransition(async () => {
      const result = await verifyEmailAction(formData);
      if (result.success) {
        router.push("/dashboard");
      } else {
        toast("error", result.error);
      }
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    if (value.length === 6) {
      submit(value);
    }
  }

  function handleResend() {
    const formData = new FormData();
    formData.set("email", email);

    startResend(async () => {
      const result = await resendVerificationOTPAction(formData);
      if (result.success) {
        toast("success", result.message ?? "Code resent.");
        setCooldown(RESEND_COOLDOWN);
      } else {
        toast("error", result.error);
      }
    });
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6 w-full">
      <p className="text-sm text-[var(--color-muted-foreground)] text-center">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-[var(--color-foreground)]">{email}</span>
      </p>

      <Input
        label="Verification code"
        name="otp"
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={otp}
        onChange={handleChange}
        disabled={isPending}
        autoComplete="one-time-code"
        className="tracking-[0.4em] text-center font-mono text-lg"
      />

      {isPending && (
        <p className="text-center text-sm text-[var(--color-muted-foreground)]">Verifying…</p>
      )}

      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : isResending ? "Sending…" : "Resend code"}
        </Button>
      </div>
    </div>
  );
}
