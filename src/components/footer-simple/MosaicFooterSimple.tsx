/**
 * MosaicFooterSimple — simple multi-column footer
 *
 * Ported from heyfabrika/styleui components/templates/axis/footer.tsx (MIT).
 * Adapted: props-driven columns (heading + links), legal text, social links.
 * No next/image or next/link — lib-portable.
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  /** Stable unique identifier */
  id: string;
  /** Column heading */
  heading: string;
  /** Links in this column */
  links: FooterLink[];
}

export interface SocialLink {
  label: string;
  href: string;
  /** Optional icon — renders as img if src provided, else renders label text */
  iconSrc?: string;
}

export interface MosaicFooterSimpleProps {
  /** Footer link columns */
  columns: FooterColumn[];
  /** Legal / copyright string */
  legal: string;
  /** Optional logo node */
  logo?: React.ReactNode;
  /** Optional social icon links */
  social?: SocialLink[];
  className?: string;
  ref?: React.Ref<HTMLElement>;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicFooterSimple — footer with columns of links, optional logo, social
 * links, and legal text. All content via props.
 *
 * @example
 * <MosaicFooterSimple
 *   logo={<img src="/logo.svg" alt="Brand" className="h-8 w-auto" />}
 *   columns={[
 *     { id: "c1", heading: "Product", links: [{ label: "Features", href: "#" }] },
 *     { id: "c2", heading: "Company", links: [{ label: "About", href: "#" }] },
 *   ]}
 *   social={[{ label: "Twitter", href: "https://x.com", iconSrc: "/icons/x.svg" }]}
 *   legal="© 2026 Mosaic. All rights reserved."
 * />
 */
export function MosaicFooterSimple({
  columns,
  legal,
  logo,
  social,
  className,
  ref,
}: MosaicFooterSimpleProps) {
  return (
    <footer
      ref={ref}
      className={cn(
        "flex flex-col items-center gap-10 px-4 py-16 border-t border-[oklch(0.9_0.005_250)]",
        className,
      )}
    >
      {/* Logo */}
      {logo && <div>{logo}</div>}

      {/* Columns */}
      {columns.length > 0 && (
        <div
          className="grid w-full max-w-4xl gap-8"
          style={{
            gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.3_0.01_250)]">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-[oklch(0.5_0.01_250)] transition-colors hover:text-[oklch(0.15_0.01_250)]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Social links */}
      {social && social.length > 0 && (
        <div className="flex flex-row gap-4">
          {social.map((s) => (
            <a
              key={s.href}
              href={s.href}
              aria-label={s.label}
              className="flex items-center justify-center transition-opacity hover:opacity-70"
              rel="noopener noreferrer"
              target="_blank"
            >
              {s.iconSrc ? (
                <img src={s.iconSrc} alt={s.label} width={24} height={24} className="size-6" />
              ) : (
                <span className="text-sm text-[oklch(0.5_0.01_250)]">{s.label}</span>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Legal */}
      <p className="text-center text-sm text-[oklch(0.55_0.01_250)]">{legal}</p>
    </footer>
  );
}

MosaicFooterSimple.displayName = "MosaicFooterSimple";
