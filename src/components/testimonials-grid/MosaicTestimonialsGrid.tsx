/**
 * MosaicTestimonialsGrid — testimonials masonry-style grid
 *
 * Ported from heyfabrika/styleui blocks/testimonial/testimonial.tsx (MIT).
 * Adapted: fully props-driven testimonials array. No shadcn Card/Avatar.
 * Layout: 6-col grid (featured first item spans 3, rest stack 3+3).
 * Falls back to uniform 2-col for 2 items, 3-col for 3+.
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TestimonialItem {
  /** Stable unique identifier */
  id: string;
  /** Quote text */
  quote: string;
  /** Author full name */
  author: string;
  /** Author role / title */
  role: string;
  /** Optional avatar src */
  avatar?: string;
  /** Optional company/brand logo src */
  logo?: string;
}

export interface MosaicTestimonialsGridProps {
  /** Testimonials to render */
  testimonials: TestimonialItem[];
  /** Optional section heading */
  heading?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLElement>;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Sub-component ─────────────────────────────────────────────────────────────

interface TestimonialCardProps {
  item: TestimonialItem;
  featured?: boolean;
}

function TestimonialCard({ item, featured = false }: TestimonialCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-[oklch(0.9_0.005_250)] bg-[oklch(1_0_0)] p-6",
        featured && "h-full",
      )}
    >
      {item.logo && (
        <img
          src={item.logo}
          alt={`${item.author} company logo`}
          width={100}
          height={32}
          className="h-8 w-auto object-contain grayscale"
        />
      )}
      <blockquote className="flex-1 text-base leading-relaxed text-[oklch(0.2_0.01_250)]">
        <p>{item.quote}</p>
      </blockquote>
      <footer className="flex items-center gap-3">
        {item.avatar ? (
          <img
            src={item.avatar}
            alt={item.author}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[oklch(0.92_0.02_250)] text-xs font-semibold text-[oklch(0.3_0.02_250)]"
          >
            {getInitials(item.author)}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[oklch(0.15_0.01_250)]">{item.author}</span>
          <span className="text-xs text-[oklch(0.5_0.01_250)]">{item.role}</span>
        </div>
      </footer>
    </article>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicTestimonialsGrid — masonry-style testimonial grid.
 * First item spans full-width on mobile, half on md; rest fill remaining slots.
 *
 * @example
 * <MosaicTestimonialsGrid
 *   heading="What our customers say"
 *   testimonials={[
 *     { id: "t1", quote: "...", author: "Alice", role: "CTO", avatar: "/a.jpg" },
 *     { id: "t2", quote: "...", author: "Bob", role: "Designer" },
 *   ]}
 * />
 */
export function MosaicTestimonialsGrid({
  testimonials,
  heading,
  className,
  ref,
}: MosaicTestimonialsGridProps) {
  const [featured, ...rest] = testimonials;

  return (
    <section ref={ref} className={cn("px-4 py-16 mx-auto max-w-6xl", className)}>
      {heading && (
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-normal tracking-tight text-[oklch(0.12_0.01_250)] md:text-4xl">
            {heading}
          </h2>
        </div>
      )}

      {testimonials.length === 0 ? null : testimonials.length === 1 ? (
        <TestimonialCard item={featured} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
          {/* Featured — spans 3 cols on md */}
          <div className="md:col-span-3 h-full">
            <TestimonialCard item={featured} featured />
          </div>

          {/* Rest — stacked in 3-col right side */}
          <div className="md:col-span-3 flex flex-col gap-6">
            {rest.map((item) => (
              <TestimonialCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

MosaicTestimonialsGrid.displayName = "MosaicTestimonialsGrid";
