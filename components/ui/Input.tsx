"use client";

import {
  type InputHTMLAttributes,
  type ReactNode,
  type ChangeEvent,
  useId,
} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  disabled,
  className = "",
  onChange,
  maxLength = 1000,
  id: providedId,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (onChange) onChange(e);
  }

  const borderClass = error
    ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)]"
    : "border-[var(--color-input)] focus-visible:ring-[var(--color-ring)]";

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[var(--color-foreground)]"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 flex items-center text-[var(--color-muted-foreground)]">
            {leftIcon}
          </span>
        )}

        <input
          {...rest}
          id={id}
          maxLength={maxLength}
          disabled={disabled}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={[
            "w-full rounded-[var(--radius-md)] border bg-[var(--color-background)]",
            "px-3 py-2 text-sm text-[var(--color-foreground)]",
            "placeholder:text-[var(--color-muted-foreground)]",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            borderClass,
            leftIcon ? "pl-9" : "",
            rightIcon ? "pr-9" : "",
            disabled ? "cursor-not-allowed opacity-50" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {rightIcon && (
          <span className="absolute right-3 flex items-center text-[var(--color-muted-foreground)]">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="animate-fade-in text-xs text-[var(--color-error)]"
        >
          {error}
        </p>
      )}

      {!error && hint && (
        <p id={hintId} className="text-xs text-[var(--color-muted-foreground)]">
          {hint}
        </p>
      )}
    </div>
  );
}
