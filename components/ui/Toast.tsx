"use client";

import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ToastType } from "@/types";
import { useToast } from "@/hooks/useToast";

// ─── Per-type config ──────────────────────────────────────────────────────────

interface ToastTypeConfig {
  icon: LucideIcon;
  color: string;
}

const TYPE_CONFIG: Record<ToastType, ToastTypeConfig> = {
  success: { icon: CheckCircle, color: "var(--color-success)" },
  error: { icon: XCircle, color: "var(--color-error)" },
  warning: { icon: AlertTriangle, color: "var(--color-warning)" },
  info: { icon: Info, color: "var(--color-foreground)" },
};

// ─── ToastContainer ───────────────────────────────────────────────────────────

/**
 * Renders the toast stack. Place once near the root of your app (inside
 * `ToastProvider`). Toasts slide up on appear and slide down on remove.
 *
 * Mobile  → fixed bottom-center (inset-x-4)
 * Desktop → fixed bottom-right  (right-4, w-[360px])
 */
export function ToastContainer() {
  const { toasts, removingIds, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      // pointer-events-none on the container so it doesn't block clicks
      // outside of the individual toast cards.
      className={[
        "fixed bottom-4 left-4 right-4 z-[9999]",
        "flex flex-col gap-2",
        "items-center",           // mobile: bottom-center
        "sm:left-auto sm:right-4", // desktop: bottom-right
        "sm:w-[360px] sm:items-end",
        "pointer-events-none",
      ].join(" ")}
    >
      {toasts.map((t) => {
        const { icon: Icon, color } = TYPE_CONFIG[t.type];
        const isRemoving = removingIds.has(t.id);

        return (
          <div
            key={t.id}
            role="alert"
            aria-live="polite"
            style={{ borderColor: color }}
            className={[
              // Layout
              "pointer-events-auto w-full relative",
              "flex items-start gap-3",
              "px-4 py-3 pr-10",
              "rounded-[var(--radius-lg)]",
              // Appearance
              "bg-[var(--color-background)] border shadow-lg",
              // Animation:
              //   enter → animate-slide-up (keyframe defined in globals.css)
              //   exit  → transition to opacity-0 + small downward shift
              "transition-[opacity,transform] duration-300 ease-out",
              isRemoving
                ? "opacity-0 translate-y-2"
                : "animate-slide-up",
            ].join(" ")}
          >
            {/* Type icon */}
            <Icon
              size={18}
              style={{ color }}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />

            {/* Message */}
            <p className="flex-1 text-sm leading-relaxed text-[var(--color-foreground)]">
              {t.message}
            </p>

            {/* Dismiss button */}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className={[
                "absolute top-3 right-3",
                "p-0.5 rounded-[var(--radius-sm)]",
                "text-[var(--color-muted-foreground)]",
                "hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-[var(--color-ring)]",
              ].join(" ")}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
