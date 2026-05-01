"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ToastItem, ToastType } from "@/types";

// Duration must exceed CSS transition length in Toast.tsx (300ms)
const ANIM_MS = 320;
const MAX_TOASTS = 5;
const DEFAULT_DURATION = 4000;

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD_TOAST"; payload: ToastItem }
  | { type: "REMOVE_TOAST"; payload: string };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case "ADD_TOAST": {
      const next = [...state, action.payload];
      // Evict oldest toasts beyond MAX_TOASTS
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    }
    case "REMOVE_TOAST":
      return state.filter((t) => t.id !== action.payload);
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: ToastItem[];
  /** IDs of toasts currently playing their exit animation */
  removingIds: ReadonlySet<string>;
  toast: (type: ToastType, message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const [removingIds, setRemovingIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  // Map<id, [animTimer?, removeTimer]>
  const timerRef = useRef(new Map<string, ReturnType<typeof setTimeout>[]>());

  /** Immediately remove a toast from state (called after exit animation). */
  const hardRemove = useCallback((id: string) => {
    const timers = timerRef.current.get(id);
    if (timers) timers.forEach(clearTimeout);
    timerRef.current.delete(id);
    dispatch({ type: "REMOVE_TOAST", payload: id });
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /** Trigger exit animation then remove. */
  const dismiss = useCallback(
    (id: string) => {
      // Cancel any pending auto-remove timers
      const timers = timerRef.current.get(id);
      if (timers) timers.forEach(clearTimeout);

      setRemovingIds((prev) => new Set(prev).add(id));
      timerRef.current.set(id, [setTimeout(() => hardRemove(id), ANIM_MS)]);
    },
    [hardRemove],
  );

  /** Add a new toast. */
  const toast = useCallback(
    (type: ToastType, message: string, duration = DEFAULT_DURATION) => {
      dispatch({
        type: "ADD_TOAST",
        payload: { id: crypto.randomUUID(), type, message, duration },
      });
    },
    [],
  );

  // Auto-remove toasts after their duration with exit animation
  useEffect(() => {
    const activeIds = new Set(toasts.map((t) => t.id));

    // Cancel timers for toasts evicted by MAX_TOASTS overflow
    timerRef.current.forEach((timers, id) => {
      if (!activeIds.has(id)) {
        timers.forEach(clearTimeout);
        timerRef.current.delete(id);
      }
    });

    // Schedule timers for newly added toasts only
    for (const t of toasts) {
      if (timerRef.current.has(t.id)) continue;

      const dur = t.duration ?? DEFAULT_DURATION;
      // Start exit animation ANIM_MS before the toast is removed
      const t1 = setTimeout(
        () => setRemovingIds((prev) => new Set(prev).add(t.id)),
        Math.max(0, dur - ANIM_MS),
      );
      const t2 = setTimeout(() => hardRemove(t.id), dur);
      timerRef.current.set(t.id, [t1, t2]);
    }
  }, [toasts, hardRemove]);

  // Cancel all timers when the provider unmounts
  useEffect(() => {
    const map = timerRef.current;
    return () => map.forEach((timers) => timers.forEach(clearTimeout));
  }, []);

  const value = useMemo(
    () => ({ toasts, removingIds, toast, dismiss }),
    [toasts, removingIds, toast, dismiss],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
