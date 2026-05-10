"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
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

  function handleGoogleSignIn() {
    startTransition(async () => {
      await signIn("google", { callbackUrl: "/dashboard" });
    });
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
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-(--color-primary) hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth isLoading={isPending} loadingText="Signing in…" disabled={isPending}>
        Sign in
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-(--color-border)" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Or
        </span>
        <span className="h-px flex-1 bg-(--color-border)" />
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={handleGoogleSignIn}
        disabled={isPending}
      >
        <FcGoogle size={18} aria-hidden="true" />
        Sign in with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-(--color-primary) hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
