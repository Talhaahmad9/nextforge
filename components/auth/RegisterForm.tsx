"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { registerAction } from "@/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFieldErrors({});

    startTransition(async () => {
      const result = await registerAction(formData);
      if (result.success) {
        const email = encodeURIComponent(formData.get("email") as string);
        router.push(`/verify-email?email=${email}`);
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        } else {
          toast("error", result.error);
        }
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
        label="Name"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Jane Doe"
        required
        disabled={isPending}
        error={fieldError("name")}
      />

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
        autoComplete="new-password"
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

      <Input
        label="Confirm password"
        name="confirmPassword"
        type={showConfirm ? "text" : "password"}
        autoComplete="new-password"
        placeholder="••••••••"
        required
        disabled={isPending}
        error={fieldError("confirmPassword")}
        rightIcon={
          <button
            type="button"
            tabIndex={-1}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            onClick={() => setShowConfirm((v) => !v)}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <Button type="submit" fullWidth isLoading={isPending} loadingText="Creating account…" disabled={isPending}>
        Create account
      </Button>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--color-primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
