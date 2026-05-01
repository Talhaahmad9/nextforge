"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { resetPasswordAction } from "@/actions/email";

// ─── Password strength ────────────────────────────────────────────────────────

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

const CRITERIA = [
  (p: string) => p.length >= 8,
  (p: string) => /[A-Z]/.test(p),
  (p: string) => /[a-z]/.test(p) && /[0-9]/.test(p),
  (p: string) => /[^A-Za-z0-9]/.test(p),
];

const LEVELS: StrengthResult[] = [
  { score: 0, label: "", color: "var(--color-border)" },
  { score: 1, label: "Weak", color: "var(--color-error)" },
  { score: 2, label: "Fair", color: "var(--color-warning)" },
  { score: 3, label: "Good", color: "var(--color-success)" },
  { score: 4, label: "Strong", color: "var(--color-success)" },
];

function getStrength(password: string): StrengthResult {
  if (!password) return LEVELS[0];
  const met = CRITERIA.filter((fn) => fn(password)).length as 0 | 1 | 2 | 3 | 4;
  return LEVELS[met];
}

function StrengthIndicator({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1" aria-hidden="true">
        {LEVELS.slice(1).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: i < score ? color : "var(--color-border)",
            }}
          />
        ))}
      </div>
      {label && (
        <p className="text-xs" style={{ color }}>
          {label} password
        </p>
      )}
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface ResetPasswordFormProps {
  email: string;
}

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("email", email);
    setFieldErrors({});

    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result.success) {
        toast("success", result.message ?? "Password updated. Redirecting…");
        setTimeout(() => router.push("/login"), 2000);
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
        label="Reset code"
        name="otp"
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        autoComplete="one-time-code"
        required
        disabled={isPending}
        error={fieldError("otp")}
        className="tracking-[0.4em] text-center font-mono text-lg"
      />

      <div className="flex flex-col gap-1">
        <Input
          label="New password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          required
          disabled={isPending}
          error={fieldError("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        <StrengthIndicator password={password} />
      </div>

      <Input
        label="Confirm new password"
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

      <Button
        type="submit"
        fullWidth
        isLoading={isPending}
        loadingText="Resetting…"
        disabled={isPending}
      >
        Reset password
      </Button>
    </form>
  );
}
