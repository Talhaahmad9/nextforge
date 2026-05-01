"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import type { ButtonVariant } from "@/types";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
  secondary:
    "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:opacity-80",
  ghost:
    "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
  destructive:
    "bg-[var(--color-error)] text-[var(--color-primary-foreground)] hover:opacity-90",
  outline:
    "bg-transparent border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
};

const sizeClasses = {
  sm: "h-8 px-3 text-sm rounded-[var(--radius-sm)]",
  md: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
  lg: "h-12 px-6 text-base rounded-[var(--radius-lg)]",
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  fullWidth = false,
  disabled = false,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50 cursor-not-allowed" : "",
        isLoading ? "pointer-events-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isLoading && <Spinner />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
