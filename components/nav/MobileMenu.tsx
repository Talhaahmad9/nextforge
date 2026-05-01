"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NavLinks } from "./NavLinks";
import type { NavLink } from "@/types";

interface MobileMenuProps {
  links: NavLink[];
  isOpen: boolean;
  onClose: () => void;
  ctaSlot?: ReactNode;
}

export function MobileMenu({ links, isOpen, onClose, ctaSlot }: MobileMenuProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const prevPathnameRef = useRef(pathname);

  // Close on route change (skip initial mount)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // ESC key + focus trap
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

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
    }

    document.addEventListener("keydown", handleKeyDown);

    // Move focus into the menu
    const firstFocusable = menuRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop — covers page below navbar */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-black/40",
          "transition-opacity duration-200",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Slide-down dropdown */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          "md:hidden fixed inset-x-0 top-16 z-50",
          "bg-[var(--color-background)] border-b border-[var(--color-border)]",
          "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <NavLinks links={links} orientation="vertical" onLinkClick={onClose} />
        {ctaSlot && (
          <div className="p-4 flex flex-col gap-3">{ctaSlot}</div>
        )}
      </div>
    </>
  );
}
