/**
 * @vantageos/mosaic-blocks — public API
 *
 * T0-ARCH: atoms (MosaicButton)
 * T3-A Batch A: 8 landing-section blocks
 * T3-B Batch B: 6 utility blocks + useMediaQuery hook
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

// ── T4: net-new components (Option A) ────────────────────────────────────────
export { MosaicFeature3Col } from "./components/feature-3col/MosaicFeature3Col.js";
export type {
  MosaicFeature3ColProps,
  Feature3ColItem,
} from "./components/feature-3col/MosaicFeature3Col.js";

// ── T3-B Batch B: utility blocks ─────────────────────────────────────────────
export { MosaicCounter } from "./components/counter/MosaicCounter.js";
export type { MosaicCounterProps } from "./components/counter/MosaicCounter.js";

export { MosaicThemeToggle } from "./components/theme-toggle/MosaicThemeToggle.js";
export type { MosaicThemeToggleProps, Theme } from "./components/theme-toggle/MosaicThemeToggle.js";

export { MosaicBlurredOrb } from "./components/blurred-orb/MosaicBlurredOrb.js";
export type {
  MosaicBlurredOrbProps,
  OrbPosition,
} from "./components/blurred-orb/MosaicBlurredOrb.js";

export { MosaicAnimatedList } from "./components/animated-list/MosaicAnimatedList.js";
export type { MosaicAnimatedListProps } from "./components/animated-list/MosaicAnimatedList.js";

export { MosaicIntegrationsBadge } from "./components/integrations-badge/MosaicIntegrationsBadge.js";
export type { MosaicIntegrationsBadgeProps } from "./components/integrations-badge/MosaicIntegrationsBadge.js";

export { MosaicFallingPattern } from "./components/falling-pattern/MosaicFallingPattern.js";
export type { MosaicFallingPatternProps } from "./components/falling-pattern/MosaicFallingPattern.js";

// ── T3-B Batch B: hooks ───────────────────────────────────────────────────────
export { useMediaQuery } from "./hooks/useMediaQuery.js";

// ── T3-C Batch C: base-ui atoms ──────────────────────────────────────────────

// Card (style-only, composable)
export {
  MosaicCard,
  MosaicCardHeader,
  MosaicCardTitle,
  MosaicCardDescription,
  MosaicCardContent,
  MosaicCardFooter,
} from "./components/card/MosaicCard.js";
export type {
  MosaicCardProps,
  MosaicCardHeaderProps,
  MosaicCardTitleProps,
  MosaicCardDescriptionProps,
  MosaicCardContentProps,
  MosaicCardFooterProps,
} from "./components/card/MosaicCard.js";

// Badge (style-only)
export { MosaicBadge, badgeVariants } from "./components/badge/MosaicBadge.js";
export type { MosaicBadgeProps } from "./components/badge/MosaicBadge.js";

// Avatar (@base-ui/react/avatar)
export { MosaicAvatar } from "./components/avatar/MosaicAvatar.js";
export type { MosaicAvatarProps } from "./components/avatar/MosaicAvatar.js";

// Input (@base-ui/react/input)
export { MosaicInput } from "./components/input/MosaicInput.js";
export type { MosaicInputProps } from "./components/input/MosaicInput.js";

// InputGroup (composition)
export { MosaicInputGroup } from "./components/input-group/MosaicInputGroup.js";
export type { MosaicInputGroupProps } from "./components/input-group/MosaicInputGroup.js";

// Field (@base-ui/react/field)
export {
  MosaicField,
  MosaicFieldLabel,
  MosaicFieldControl,
  MosaicFieldDescription,
  MosaicFieldError,
} from "./components/field/MosaicField.js";
export type {
  MosaicFieldProps,
  MosaicFieldLabelProps,
  MosaicFieldControlProps,
  MosaicFieldDescriptionProps,
  MosaicFieldErrorProps,
} from "./components/field/MosaicField.js";

// Switch (@base-ui/react/switch)
export { MosaicSwitch } from "./components/switch/MosaicSwitch.js";
export type { MosaicSwitchProps } from "./components/switch/MosaicSwitch.js";

// Select (@base-ui/react/select)
export { MosaicSelect } from "./components/select/MosaicSelect.js";
export type { MosaicSelectItem, MosaicSelectProps } from "./components/select/MosaicSelect.js";

// Combobox (@base-ui/react/combobox)
export { MosaicCombobox } from "./components/combobox/MosaicCombobox.js";
export type {
  MosaicComboboxItem,
  MosaicComboboxProps,
} from "./components/combobox/MosaicCombobox.js";

// DropdownMenu (@base-ui/react/menu)
export { MosaicDropdownMenu } from "./components/dropdown-menu/MosaicDropdownMenu.js";
export type {
  MosaicDropdownMenuItem,
  MosaicDropdownMenuProps,
} from "./components/dropdown-menu/MosaicDropdownMenu.js";
