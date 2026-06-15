/**
 * @vantageos/mosaic-blocks — public API
 *
 * T0-ARCH: atoms (MosaicButton)
 * T3-A Batch A: 8 landing-section blocks
 */

export { version } from "./version.js";
export { Placeholder } from "./placeholder.js";

// ── T0-ARCH: atoms ───────────────────────────────────────────────────────────
export { MosaicButton, buttonVariants } from "./components/button/Button.js";
export type { MosaicButtonProps } from "./components/button/Button.js";

// ── T3-A Batch A: landing section blocks ─────────────────────────────────────
export { MosaicNavbar } from "./components/navbar/MosaicNavbar.js";
export type { MosaicNavbarProps, NavLink, NavCta } from "./components/navbar/MosaicNavbar.js";

export { MosaicHeroSplit } from "./components/hero-split/MosaicHeroSplit.js";
export type {
  MosaicHeroSplitProps,
  HeroCta,
} from "./components/hero-split/MosaicHeroSplit.js";

export { MosaicFeatureCenteredMedia } from "./components/feature-centered-media/MosaicFeatureCenteredMedia.js";
export type {
  MosaicFeatureCenteredMediaProps,
  FeatureItem,
} from "./components/feature-centered-media/MosaicFeatureCenteredMedia.js";

export { MosaicStatsGrid } from "./components/stats-grid/MosaicStatsGrid.js";
export type {
  MosaicStatsGridProps,
  StatItem,
} from "./components/stats-grid/MosaicStatsGrid.js";

export { MosaicPricingCard } from "./components/pricing-card/MosaicPricingCard.js";
export type {
  MosaicPricingCardProps,
  PricingCta,
} from "./components/pricing-card/MosaicPricingCard.js";

export { MosaicLogosGrid } from "./components/logos-grid/MosaicLogosGrid.js";
export type {
  MosaicLogosGridProps,
  LogoItem,
} from "./components/logos-grid/MosaicLogosGrid.js";

export { MosaicTestimonialsGrid } from "./components/testimonials-grid/MosaicTestimonialsGrid.js";
export type {
  MosaicTestimonialsGridProps,
  TestimonialItem,
} from "./components/testimonials-grid/MosaicTestimonialsGrid.js";

export { MosaicFooterSimple } from "./components/footer-simple/MosaicFooterSimple.js";
export type {
  MosaicFooterSimpleProps,
  FooterColumn,
  FooterLink,
  SocialLink,
} from "./components/footer-simple/MosaicFooterSimple.js";
