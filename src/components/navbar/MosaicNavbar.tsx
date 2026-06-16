"use client";

/**
 * MosaicNavbar — scroll-aware fixed navbar
 *
 * Ported from heyfabrika/styleui components/templates/axis/navbar.tsx (MIT).
 * Adapted: props-driven (no hardcoded links/logo/cta), no next/router dependency,
 * motion/react replaced with CSS transitions for bundle budget.
 * Scroll hide-on-scroll-down via native scroll listener.
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

export interface NavCta {
  label: string;
  href: string;
}

export interface MosaicNavbarProps {
  /** Logo node (image, svg, or text). All branding via this prop. */
  logo: React.ReactNode;
  /** Navigation links */
  links: NavLink[];
  /** Optional CTA button */
  cta?: NavCta;
  className?: string;
  ref?: React.Ref<HTMLElement>;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicNavbar — fixed top navbar with scroll-aware hide-on-scroll-down and
 * blur backdrop on scroll. Mobile menu included. All content via props.
 *
 * @example
 * <MosaicNavbar
 *   logo={<img src="/logo.svg" alt="Brand" className="h-8 w-auto" />}
 *   links={[{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }]}
 *   cta={{ label: "Get started", href: "#start" }}
 * />
 */
export function MosaicNavbar({ logo, links, cta, className, ref }: MosaicNavbarProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setIsScrolled(current > 50);
      if (current > lastScrollY.current && current > 150) {
        setIsHidden(true);
        setIsOpen(false);
      } else {
        setIsHidden(false);
      }
      lastScrollY.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav
      ref={ref}
      aria-label="Main navigation"
      className={cn(
        "fixed left-0 right-0 top-0 z-50 px-4 pt-4 mx-auto w-full max-w-6xl transition-all duration-300 ease-out",
        isHidden ? "opacity-0 -translate-y-5 pointer-events-none" : "opacity-100 translate-y-0",
        className,
      )}
    >
      <div
        className={cn(
          "relative mx-auto transition-transform duration-200",
          isScrolled ? "scale-[0.98]" : "scale-100",
        )}
      >
        <div
          className={cn(
            "flex flex-row items-center justify-between gap-4 rounded-full border border-[oklch(0.9_0.005_250)] p-2 transition-all duration-300",
            isScrolled
              ? "bg-[oklch(1_0_0_/_0.8)] backdrop-blur-[12px] shadow-[0_4px_20px_-5px_oklch(0_0_0_/_0.1)]"
              : "bg-[oklch(1_0_0)]",
          )}
        >
          {/* Logo */}
          <div className="ml-2 flex items-center">{logo}</div>

          {/* Desktop links */}
          <div className="hidden flex-row items-center gap-4 lg:flex">
            <div className="flex flex-row gap-8">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex flex-row items-center gap-1 font-medium transition-colors hover:text-[oklch(0.6_0.01_250)]"
                >
                  {link.label}
                </a>
              ))}
            </div>
            {cta && (
              <a
                href={cta.href}
                className="inline-flex items-center justify-center rounded-full bg-[oklch(0.15_0.01_250)] px-5 py-2 text-sm font-medium text-[oklch(0.98_0_0)] transition-colors hover:bg-[oklch(0.25_0.01_250)]"
              >
                {cta.label}
              </a>
            )}
          </div>

          {/* Mobile: cta + hamburger */}
          <div className="flex flex-row items-center gap-2 lg:hidden">
            {cta && (
              <a
                href={cta.href}
                className="inline-flex items-center justify-center rounded-full bg-[oklch(0.15_0.01_250)] px-4 py-1.5 text-sm font-medium text-[oklch(0.98_0_0)] transition-colors"
              >
                {cta.label}
              </a>
            )}
            <button
              type="button"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mosaic-mobile-menu"
              onClick={() => setIsOpen((v) => !v)}
              className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-[oklch(0.95_0.005_250)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {isOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="8" x2="20" y2="8" />
                    <line x1="4" y1="16" x2="20" y2="16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isOpen && (
          <div
            id="mosaic-mobile-menu"
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden lg:hidden"
          >
            <div className="flex flex-col gap-2 rounded-2xl border border-[oklch(0.9_0.005_250)] bg-[oklch(1_0_0_/_0.95)] p-4 backdrop-blur-xl">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex flex-row items-center justify-between rounded-lg px-4 py-3 font-medium transition-colors hover:bg-[oklch(0.96_0.005_250)]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

MosaicNavbar.displayName = "MosaicNavbar";
