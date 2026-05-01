"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import type { NavLink } from "@/types";

interface NavLinksProps {
  links: NavLink[];
  orientation: "horizontal" | "vertical";
  onLinkClick?: () => void;
}

export function NavLinks({ links, orientation, onLinkClick }: NavLinksProps) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";

  return (
    <nav
      className={
        isVertical ? "flex flex-col w-full" : "flex items-center gap-0.5"
      }
    >
      {links.map((link) => {
        const isActive = pathname === link.href;
        const baseClass = [
          "flex items-center gap-1.5 text-sm font-medium transition-colors",
          isActive
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
          isVertical
            ? "w-full py-3 px-4 border-b border-[var(--color-border)]"
            : "px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--color-muted)]",
        ].join(" ");

        if (link.external) {
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={baseClass}
              onClick={onLinkClick}
            >
              {link.label}
              <ExternalLink size={13} aria-hidden="true" className="shrink-0" />
            </a>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className={baseClass}
            onClick={onLinkClick}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
