"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PANEL_SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "w-full max-w-sm",
  md: "w-full max-w-md",
  lg: "w-full max-w-2xl",
  full: "w-full h-full max-w-none",
};

/** Matches all interactive elements that should receive keyboard focus. */
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnBackdrop = true,
  showCloseButton = true,
}: ModalProps) {
  // SSR guard: server snapshot = false, client snapshot = true (no effect needed)
  const mounted = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false,
  );
  // Whether the portal DOM is present (stays true during exit animation)
  const [rendered, setRendered] = useState(false);
  // Whether the open CSS classes are applied (drives the CSS transition)
  const [animOpen, setAnimOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  // useId() is stable across renders and SSR-safe
  const rawId = useId();
  const titleId = `modal-title-${rawId}`;

  const isFullSize = size === "full";

  // ── Show / hide portal ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Defer to next macrotask so the setState is async (avoids cascading
      // renders lint warning) and also gives React time to flush before we
      // apply the enter-animation class in the next effect.
      const id = setTimeout(() => setRendered(true), 0);
      return () => clearTimeout(id);
    } else {
      // Remove open classes → triggers CSS exit transition.
      // setRendered(false) is called by onTransitionEnd after animation ends.
      const id = setTimeout(() => setAnimOpen(false), 0);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // ── Trigger enter animation after portal mounts ─────────────────────────────
  useEffect(() => {
    if (!rendered || !isOpen) return;
    // One rAF lets the browser paint the portal at the starting (closed) CSS
    // state before we apply the open classes, so the transition plays.
    const raf = requestAnimationFrame(() => setAnimOpen(true));
    return () => cancelAnimationFrame(raf);
  }, [rendered, isOpen]);

  // ── Scroll lock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ── Focus trap + ESC ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!animOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    const getFocusable = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    // Auto-focus first focusable element
    getFocusable()[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const els = getFocusable();
      if (!els.length) {
        e.preventDefault();
        return;
      }

      const first = els[0];
      const last = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [animOpen, onClose]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) onClose();
  }, [closeOnBackdrop, onClose]);

  function handleTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    // Ignore events that bubbled up from child elements
    if (e.target !== panelRef.current) return;
    // Only react to the opacity transition to avoid firing twice
    if (e.propertyName !== "opacity") return;
    // Unmount the portal after the exit transition completes
    if (!isOpen) setRendered(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!mounted || !rendered) return null;

  return createPortal(
    <div
      // Backdrop
      className={[
        "fixed inset-0 z-[9998] flex",
        isFullSize ? "p-0" : "items-center justify-center p-4",
        "bg-black/50",
        "transition-opacity duration-300",
        animOpen ? "opacity-100" : "opacity-0",
      ].join(" ")}
      onClick={handleBackdropClick}
    >
      {/* Panel — click stops propagation so backdrop handler doesn't fire */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          PANEL_SIZE[size],
          "bg-[var(--color-background)] text-[var(--color-foreground)]",
          isFullSize ? "rounded-none" : "rounded-[var(--radius-xl)]",
          "flex flex-col shadow-2xl",
          "transition-[opacity,transform] duration-300 ease-out",
          animOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2
            id={titleId}
            className="text-base font-semibold text-[var(--color-foreground)]"
          >
            {title}
          </h2>

          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className={[
                "p-1.5 rounded-[var(--radius-sm)]",
                "text-[var(--color-muted-foreground)]",
                "hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-[var(--color-ring)]",
              ].join(" ")}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
