"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";
import { logoutAction } from "@/actions/auth";
import type { NavLink } from "@/types";

/** Import this constant and apply `paddingTop: NAVBAR_HEIGHT` (or `pt-16`) to your page content. */
export const NAVBAR_HEIGHT = 64;

interface NavbarProps {
  links: NavLink[];
  ctaSlot?: ReactNode;
  logo?: ReactNode;
  showThemeToggle?: boolean;
  showAuth?: boolean;
}

// ─── Auth section (skeleton / signed-in / signed-out) ─────────────────────────

function AuthSection() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2" aria-hidden="true">
        <div className="h-8 w-16 rounded-[var(--radius-md)] bg-[var(--color-muted)] animate-pulse" />
        <div className="h-8 w-20 rounded-[var(--radius-md)] bg-[var(--color-muted)] animate-pulse" />
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User avatar"}
            width={32}
            height={32}
            className="rounded-full shrink-0"
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center text-sm font-semibold select-none shrink-0"
          >
            {session.user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
        <span className="hidden lg:block text-sm font-medium text-[var(--color-foreground)] max-w-[120px] truncate">
          {session.user.name}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            Logout
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--color-muted)]"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-3 py-2 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
      >
        Register
      </Link>
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────────

export function Navbar({
  links,
  ctaSlot,
  logo,
  showThemeToggle = true,
  showAuth = true,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 h-16 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)]"
      >
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex-shrink-0">
            {logo ?? (
              <Link
                href="/"
                className="text-lg font-bold text-[var(--color-foreground)]"
              >
                Logo
              </Link>
            )}
          </div>

          {/* Desktop nav links — centered */}
          <div className="hidden md:flex items-center flex-1 justify-center">
            <NavLinks links={links} orientation="horizontal" />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {showThemeToggle && <ThemeToggle />}

            {/* Desktop: auth + ctaSlot */}
            <div className="hidden md:flex items-center gap-2">
              {showAuth && <AuthSection />}
              {ctaSlot}
            </div>

            {/* Mobile: hamburger */}
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown — rendered outside the header to avoid stacking context issues */}
      <MobileMenu
        links={links}
        isOpen={mobileOpen}
        onClose={closeMobile}
        ctaSlot={
          <>
            {showAuth && <AuthSection />}
            {ctaSlot}
          </>
        }
      />
    </>
  );
}
