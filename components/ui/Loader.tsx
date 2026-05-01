"use client";

import type { LoaderVariant } from "@/types";

interface LoaderProps {
  variant?: LoaderVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const svgSizes = { sm: 16, md: 24, lg: 36 };
const dotSizes = { sm: "h-1.5 w-1.5", md: "h-2.5 w-2.5", lg: "h-3.5 w-3.5" };
const skeletonSizes = { sm: "h-4 w-24", md: "h-6 w-40", lg: "h-8 w-64" };

function Spinner({ size }: { size: "sm" | "md" | "lg" }) {
  const px = svgSizes[size];
  const r = (px / 2) * 0.75;
  const cx = px / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        stroke="var(--color-muted)"
        strokeWidth="3"
      />
      {/* Arc */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.75}
        className="origin-center animate-spin"
        style={{ transformOrigin: `${cx}px ${cx}px` }}
      />
    </svg>
  );
}

function Dots({ size }: { size: "sm" | "md" | "lg" }) {
  const dot = dotSizes[size];
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className={`${dot} rounded-full bg-[var(--color-primary)] animate-bounce`}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function Skeleton({ size }: { size: "sm" | "md" | "lg" }) {
  return (
    <div
      className={`${skeletonSizes[size]} animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]`}
      aria-hidden="true"
    />
  );
}

export function Loader({
  variant = "spinner",
  size = "md",
  className = "",
  text,
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={text ?? "Loading"}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {variant === "spinner" && <Spinner size={size} />}
      {variant === "dots" && <Dots size={size} />}
      {variant === "skeleton" && <Skeleton size={size} />}
      {text && <span className="sr-only">{text}</span>}
    </div>
  );
}

export function FullPageLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background)]">
      <Loader variant="spinner" size="lg" text={text ?? "Loading"} />
    </div>
  );
}
