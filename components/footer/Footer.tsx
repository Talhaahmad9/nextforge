import type { ReactNode } from "react";
import Link from "next/link";
import type { NavLink } from "@/types";

interface FooterProps {
  links?: NavLink[][];
  /** One heading per link group column, matched by index. */
  headings?: string[];
  copyrightName?: string;
  logo?: ReactNode;
}

export function Footer({ links, headings, copyrightName, logo }: FooterProps) {
  const year = new Date().getFullYear();
  const hasLinks = links && links.length > 0;

  return (
    <footer
      aria-label="Site footer"
      className="border-t border-[var(--color-border)] bg-[var(--color-background)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* ── Main content ── */}
        <div className="flex flex-col gap-10 md:flex-row md:gap-16">

          {/* Left: logo + brand tagline */}
          {(logo || copyrightName) && (
            <div className="shrink-0 md:w-52">
              {logo && <div>{logo}</div>}
              {copyrightName && (
                <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
                  {copyrightName}
                </p>
              )}
            </div>
          )}

          {/* Right: link group columns */}
          {hasLinks && (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:flex-1 md:justify-items-start">
              {links.map((group, colIndex) => (
                <div key={colIndex}>
                  {headings?.[colIndex] && (
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                      {headings[colIndex]}
                    </h3>
                  )}
                  <ul className="flex flex-col gap-3">
                    {group.map((link) => (
                      <li key={link.href}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--color-muted-foreground)] transition-colors duration-200 hover:text-[var(--color-foreground)]"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-sm text-[var(--color-muted-foreground)] transition-colors duration-200 hover:text-[var(--color-foreground)]"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom bar ── */}
        {copyrightName && (
          <div className="mt-12 pt-6 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-muted-foreground)] text-center md:text-left">
              &copy; {year} {copyrightName}. All rights reserved.
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
