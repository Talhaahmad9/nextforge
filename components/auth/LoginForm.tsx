"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { loginAction } from "@/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFieldErrors({});

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.success) {
        router.push("/dashboard");
      } else if (result.fieldErrors) {
        // Validation errors — show inline under each field
        setFieldErrors(result.fieldErrors);
      } else {
        // Server-level error (wrong credentials, DB down, etc.) — show as toast
        toast("error", result.error);
      }
    });
  }

  function fieldError(name: string) {
    return fieldErrors[name]?.[0];
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="animate-fade-in flex flex-col gap-5 w-full"
    >
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        disabled={isPending}
        error={fieldError("email")}
      />

      <Input
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="••••••••"
        required
        disabled={isPending}
        error={fieldError("password")}
        rightIcon={
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth isLoading={isPending} loadingText="Signing in…" disabled={isPending}>
        Sign in
      </Button>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[var(--color-primary)] hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
