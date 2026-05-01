"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

// ─── Module-level theme store ─────────────────────────────────────────────────
// useSyncExternalStore is the React-recommended pattern for reading external
// state (localStorage) without calling setState inside an effect body.

const themeListeners = new Set<() => void>();

function subscribeToTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function getThemeSnapshot(): boolean {
  const stored = localStorage.getItem("theme");
  return (
    stored === "dark" ||
    (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

// Server snapshot returned during SSR and initial hydration.
// React will reconcile with getThemeSnapshot post-hydration, preventing mismatch.
function getServerThemeSnapshot(): boolean {
  return false;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ThemeToggle() {
  // isDark is false on SSR/hydration (server snapshot), then corrected post-hydration.
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  // Sync 'dark' class on <html> whenever isDark changes (React state → external DOM).
  // This effect reads state to update an external system — the correct use of effects.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  function toggle() {
    const next = !isDark;
    localStorage.setItem("theme", next ? "dark" : "light");
    // Notify all subscribers so useSyncExternalStore re-reads the snapshot
    themeListeners.forEach((l) => l());
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className="relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
    >
      {/* Sun — visible in light mode */}
      <span
        aria-hidden="true"
        className={`absolute transition-all duration-200 ${
          isDark ? "opacity-0 scale-75" : "opacity-100 scale-100"
        }`}
      >
        <Sun size={18} />
      </span>
      {/* Moon — visible in dark mode */}
      <span
        aria-hidden="true"
        className={`absolute transition-all duration-200 ${
          isDark ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        <Moon size={18} />
      </span>
    </button>
  );
}
