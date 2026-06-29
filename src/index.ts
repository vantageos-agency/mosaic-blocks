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

// ── #19: MosaicEmptyState ────────────────────────────────────────────────────
export { MosaicEmptyState } from "./components/empty-state/MosaicEmptyState.js";
export type { MosaicEmptyStateProps } from "./components/empty-state/MosaicEmptyState.js";

// ── #24: base-UI atoms ───────────────────────────────────────────────────────

// Accordion (@base-ui/react/accordion)
export {
  MosaicAccordion,
  MosaicAccordionItem,
  MosaicAccordionTrigger,
  MosaicAccordionPanel,
  Accordion,
} from "./components/accordion/MosaicAccordion.js";
export type {
  MosaicAccordionProps,
  MosaicAccordionItemProps,
  MosaicAccordionTriggerProps,
  MosaicAccordionPanelProps,
} from "./components/accordion/MosaicAccordion.js";

// Checkbox (@base-ui/react/checkbox)
export { MosaicCheckbox } from "./components/checkbox/MosaicCheckbox.js";
export type { MosaicCheckboxProps } from "./components/checkbox/MosaicCheckbox.js";

// Collapsible (@base-ui/react/collapsible)
export {
  MosaicCollapsible,
  MosaicCollapsibleTrigger,
  MosaicCollapsiblePanel,
} from "./components/collapsible/MosaicCollapsible.js";
export type {
  MosaicCollapsibleProps,
  MosaicCollapsibleTriggerProps,
  MosaicCollapsiblePanelProps,
} from "./components/collapsible/MosaicCollapsible.js";

// Progress (@base-ui/react/progress)
export { MosaicProgress } from "./components/progress/MosaicProgress.js";
export type { MosaicProgressProps } from "./components/progress/MosaicProgress.js";

// RadioGroup (@base-ui/react/radio-group + radio)
export {
  MosaicRadioGroup,
  MosaicRadioGroupItem,
} from "./components/radio-group/MosaicRadioGroup.js";
export type {
  MosaicRadioGroupProps,
  MosaicRadioGroupItemProps,
} from "./components/radio-group/MosaicRadioGroup.js";

// ScrollArea (@base-ui/react/scroll-area)
export { MosaicScrollArea } from "./components/scroll-area/MosaicScrollArea.js";
export type { MosaicScrollAreaProps } from "./components/scroll-area/MosaicScrollArea.js";

// Separator (@base-ui/react/separator)
export { MosaicSeparator } from "./components/separator/MosaicSeparator.js";
export type { MosaicSeparatorProps } from "./components/separator/MosaicSeparator.js";

// Slider (@base-ui/react/slider)
export { MosaicSlider } from "./components/slider/MosaicSlider.js";
export type { MosaicSliderProps } from "./components/slider/MosaicSlider.js";

// Tabs (@base-ui/react/tabs)
export {
  MosaicTabs,
  MosaicTabsList,
  MosaicTabsTrigger,
  MosaicTabsPanel,
} from "./components/tabs/MosaicTabs.js";
export type {
  MosaicTabsProps,
  MosaicTabsListProps,
  MosaicTabsTriggerProps,
  MosaicTabsPanelProps,
} from "./components/tabs/MosaicTabs.js";

// Textarea (native <textarea> styled)
export { MosaicTextarea } from "./components/textarea/MosaicTextarea.js";
export type { MosaicTextareaProps } from "./components/textarea/MosaicTextarea.js";

// Tooltip (@base-ui/react/tooltip)
export { MosaicTooltip, Tooltip } from "./components/tooltip/MosaicTooltip.js";
export type { MosaicTooltipProps } from "./components/tooltip/MosaicTooltip.js";

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

// ── T3-D anydebate shell blocks ───────────────────────────────────────────────

// DeviceProvider + hooks (PC-01) — foundation for all adaptive components
export {
  MosaicDeviceProvider,
  useDevice,
  useBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useViewport,
  useOrientation,
} from "./components/device-provider/MosaicDeviceProvider.js";
export type {
  DeviceContextValue,
  Orientation,
  Breakpoint,
  MosaicDeviceProviderProps,
} from "./components/device-provider/MosaicDeviceProvider.js";

// AdaptiveGrid (PC-02)
export { MosaicAdaptiveGrid } from "./components/adaptive-grid/MosaicAdaptiveGrid.js";
export type { MosaicAdaptiveGridProps } from "./components/adaptive-grid/MosaicAdaptiveGrid.js";

// AdaptiveModal (PC-03)
export { MosaicAdaptiveModal } from "./components/adaptive-modal/MosaicAdaptiveModal.js";
export type { MosaicAdaptiveModalProps } from "./components/adaptive-modal/MosaicAdaptiveModal.js";

// AdaptiveNavigation (PC-04)
export { MosaicAdaptiveNavigation } from "./components/adaptive-navigation/MosaicAdaptiveNavigation.js";
export type {
  MosaicAdaptiveNavigationProps,
  MosaicNavigationItem,
} from "./components/adaptive-navigation/MosaicAdaptiveNavigation.js";

// DashboardLayout (PC-05) — full app shell
export { MosaicDashboardLayout } from "./components/dashboard-layout/MosaicDashboardLayout.js";
export type {
  MosaicDashboardLayoutProps,
  MosaicBreadcrumb,
} from "./components/dashboard-layout/MosaicDashboardLayout.js";

// AppSidebar (PC-06) — collapsible + mobile drawer
export { MosaicAppSidebar } from "./components/app-sidebar/MosaicAppSidebar.js";
export type {
  MosaicAppSidebarProps,
  MosaicSidebarNavItem,
  MosaicSidebarQuickAction,
  MosaicSidebarRecentItem,
  MosaicSidebarFooterStatus,
} from "./components/app-sidebar/MosaicAppSidebar.js";

// QuickActionCard (PC-07) — 6-accent action grid
export { MosaicQuickActionCard } from "./components/quick-action-card/MosaicQuickActionCard.js";
export type {
  MosaicQuickActionCardProps,
  MosaicQuickAction,
  MosaicActionAccent,
} from "./components/quick-action-card/MosaicQuickActionCard.js";

// ActivityFeed + ActivityItem (PC-08)
export {
  MosaicActivityFeed,
  MosaicActivityItem,
} from "./components/activity-feed/MosaicActivityFeed.js";
export type {
  MosaicActivityFeedProps,
  MosaicActivityItemProps,
  MosaicActivity,
  MosaicActivityStatus,
} from "./components/activity-feed/MosaicActivityFeed.js";

// AgentComposer — responsive-pair orchestrator (PC-09 + PC-10)
export { MosaicAgentComposer } from "./components/agent-composer/MosaicAgentComposer.js";
export { MosaicAgentComposerDesktop } from "./components/agent-composer/MosaicAgentComposerDesktop.js";
export { MosaicAgentComposerMobile } from "./components/agent-composer/MosaicAgentComposerMobile.js";
export type {
  MosaicAgentComposerProps,
  MosaicComposerModule,
  MosaicComposerModel,
} from "./components/agent-composer/MosaicAgentComposer.js";
export type { MosaicAgentComposerMobileProps } from "./components/agent-composer/MosaicAgentComposerMobile.js";

// ModuleCard (PC-11) — selected module display card
export { MosaicModuleCard } from "./components/module-card/MosaicModuleCard.js";
export type {
  MosaicModuleCardProps,
  MosaicModuleData,
  MosaicModuleType,
} from "./components/module-card/MosaicModuleCard.js";

// ── T3-D wave-2: remaining anydebate shell blocks ─────────────────────────────

// MosaicThemeProvider — next-themes wrapper
export { MosaicThemeProvider } from "./components/theme-provider/MosaicThemeProvider.js";
export type { MosaicThemeProviderProps } from "./components/theme-provider/MosaicThemeProvider.js";

// MosaicDeleteConfirmationDialog — generic destructive confirm dialog
export { MosaicDeleteConfirmationDialog } from "./components/delete-confirmation-dialog/MosaicDeleteConfirmationDialog.js";
export type { MosaicDeleteConfirmationDialogProps } from "./components/delete-confirmation-dialog/MosaicDeleteConfirmationDialog.js";

// MosaicPreferencesPanel — generic user preferences form
export { MosaicPreferencesPanel } from "./components/preferences-panel/MosaicPreferencesPanel.js";
export type {
  MosaicPreferencesPanelProps,
  MosaicPreferenceGroup,
  MosaicPreference,
  MosaicSelectItem as MosaicPrefSelectItem,
} from "./components/preferences-panel/MosaicPreferencesPanel.js";

// MosaicProfilePanel — generic user profile form
export { MosaicProfilePanel } from "./components/profile-panel/MosaicProfilePanel.js";
export type {
  MosaicProfilePanelProps,
  MosaicProfileField,
} from "./components/profile-panel/MosaicProfilePanel.js";

// MosaicMainNav — generic responsive top-nav
export { MosaicMainNav } from "./components/main-nav/MosaicMainNav.js";
export type {
  MosaicMainNavProps,
  MosaicNavItem,
} from "./components/main-nav/MosaicMainNav.js";

// MosaicAgentCard — generic agent/resource card
export { MosaicAgentCard } from "./components/agent-card/MosaicAgentCard.js";
export type {
  MosaicAgentCardProps,
  MosaicAgentData,
} from "./components/agent-card/MosaicAgentCard.js";

// MosaicQuickAgentSelector — compact agent pill picker
export { MosaicQuickAgentSelector } from "./components/quick-agent-selector/MosaicQuickAgentSelector.js";
export type {
  MosaicQuickAgentSelectorProps,
  MosaicQuickAgent,
} from "./components/quick-agent-selector/MosaicQuickAgentSelector.js";

// MosaicSelectorModal — generic searchable item picker modal
export { MosaicSelectorModal } from "./components/selector-modal/MosaicSelectorModal.js";
export type {
  MosaicSelectorModalProps,
  MosaicSelectorItem,
  MosaicSelectorCategory,
} from "./components/selector-modal/MosaicSelectorModal.js";

// MosaicMessageCard — generic message/chat card
export { MosaicMessageCard } from "./components/message-card/MosaicMessageCard.js";
export type {
  MosaicMessageCardProps,
  MosaicMessage,
  MosaicMessageSender,
  MosaicMessageSenderType,
  MosaicMessageReactions,
} from "./components/message-card/MosaicMessageCard.js";

// MosaicMessageList — responsive message list (responsive-pair)
export {
  MosaicMessageList,
  MosaicMessageListDesktop,
  MosaicMessageListMobile,
} from "./components/message-list/MosaicMessageList.js";
export type { MosaicMessageListProps } from "./components/message-list/MosaicMessageList.js";

// MosaicFilterSidebar — generic collapsible filter sidebar
export { MosaicFilterSidebar } from "./components/filter-sidebar/MosaicFilterSidebar.js";
export type {
  MosaicFilterSidebarProps,
  MosaicFilterOption,
} from "./components/filter-sidebar/MosaicFilterSidebar.js";

// MosaicAgentList — responsive agent list (responsive-pair)
export {
  MosaicAgentList,
  MosaicAgentListDesktop,
  MosaicAgentListMobile,
} from "./components/agent-list/MosaicAgentList.js";
export type { MosaicAgentListProps } from "./components/agent-list/MosaicAgentList.js";

// MosaicMarketplaceList — responsive marketplace grid/list (responsive-pair)
export {
  MosaicMarketplaceList,
  MosaicMarketplaceListDesktop,
  MosaicMarketplaceListMobile,
} from "./components/marketplace-list/MosaicMarketplaceList.js";
export type {
  MosaicMarketplaceListProps,
  MosaicMarketplaceItem,
} from "./components/marketplace-list/MosaicMarketplaceList.js";

// MosaicTemplateGallery — generic template browser (responsive-pair)
export {
  MosaicTemplateGallery,
  MosaicTemplateCard,
  MosaicTemplatePreview,
  MosaicQuickStartPanel,
  MosaicAgentTeamPreview,
} from "./components/template-gallery/MosaicTemplateGallery.js";
export type {
  MosaicTemplateGalleryProps,
  MosaicTemplateCardProps,
  MosaicTemplatePreviewProps,
  MosaicQuickStartPanelProps,
  MosaicAgentTeamPreviewProps,
  MosaicTemplate,
  MosaicTemplateAgent,
  MosaicTemplateMetadata,
  MosaicScenario,
  MosaicAgentPreset,
} from "./components/template-gallery/MosaicTemplateGallery.js";

// MosaicModuleLibrary — generic module/library manager (responsive-pair)
export {
  MosaicModuleLibrary,
  MosaicModuleForm,
} from "./components/module-library/MosaicModuleLibrary.js";
export type {
  MosaicModuleLibraryProps,
  MosaicModuleFormProps,
  MosaicModuleItem,
  MosaicModuleFormField,
} from "./components/module-library/MosaicModuleLibrary.js";

// MosaicOrgPanel — generic org management shell (responsive-pair)
export {
  MosaicOrgPanel,
  MosaicOrgRoleBadge,
  MosaicMultiOrgIndicator,
  MosaicCreateOrgDialog,
  MosaicInviteMemberDialog,
  MosaicMemberList,
} from "./components/org-panel/MosaicOrgPanel.js";
export type {
  MosaicOrgPanelProps,
  MosaicOrgPanelTab,
  MosaicOrgRoleBadgeProps,
  MosaicMultiOrgIndicatorProps,
  MosaicCreateOrgDialogProps,
  MosaicInviteMemberDialogProps,
  MosaicMemberListProps,
  MosaicOrgInfo,
  MosaicOrgMember,
  MosaicOrgRole,
  MosaicOrgStats,
  MosaicStatItem,
} from "./components/org-panel/MosaicOrgPanel.js";

// MosaicDashboardContent — generic dashboard content area with view switcher
export { MosaicDashboardContent } from "./components/dashboard-content/MosaicDashboardContent.js";
export type {
  MosaicDashboardContentProps,
  MosaicDashboardView,
} from "./components/dashboard-content/MosaicDashboardContent.js";

// MosaicDashboardHeader — generic sticky dashboard header
export { MosaicDashboardHeader } from "./components/dashboard-header/MosaicDashboardHeader.js";
export type { MosaicDashboardHeaderProps } from "./components/dashboard-header/MosaicDashboardHeader.js";

// MosaicOrgSwitcher — presentational org picker dropdown
export { MosaicOrgSwitcher } from "./components/org-switcher/MosaicOrgSwitcher.js";
export type {
  MosaicOrgSwitcherProps,
  MosaicOrg,
} from "./components/org-switcher/MosaicOrgSwitcher.js";

// MosaicQuickActionsMenu — generic dropdown quick-actions button
export { MosaicQuickActionsMenu } from "./components/quick-actions-menu/MosaicQuickActionsMenu.js";
export type {
  MosaicQuickActionsMenuProps,
  MosaicQuickAction as MosaicQuickActionsMenuItem,
} from "./components/quick-actions-menu/MosaicQuickActionsMenu.js";

// ── T1.5: Auth wrappers (Clerk peer) ─────────────────────────────────────────

// MosaicSignInLayout — sign-in page layout, themed, mobile-first (Clerk SignIn)
export { MosaicSignInLayout } from "./components/auth/sign-in-layout/MosaicSignInLayout.js";
export type { MosaicSignInLayoutProps } from "./components/auth/sign-in-layout/MosaicSignInLayout.js";

// MosaicSignUpLayout — sign-up page layout, themed, mobile-first (Clerk SignUp)
export { MosaicSignUpLayout } from "./components/auth/sign-up-layout/MosaicSignUpLayout.js";
export type { MosaicSignUpLayoutProps } from "./components/auth/sign-up-layout/MosaicSignUpLayout.js";

// MosaicClerkOrgSwitcher — Clerk-backed (live org data). DISTINCT from
// MosaicOrgSwitcher (presentational, orgs via props).
export { MosaicClerkOrgSwitcher } from "./components/auth/clerk-org-switcher/MosaicClerkOrgSwitcher.js";
export type { MosaicClerkOrgSwitcherProps } from "./components/auth/clerk-org-switcher/MosaicClerkOrgSwitcher.js";

// MosaicUserButton — Clerk UserButton with OKLCH appearance
export { MosaicUserButton } from "./components/auth/user-button/MosaicUserButton.js";
export type { MosaicUserButtonProps } from "./components/auth/user-button/MosaicUserButton.js";

// MosaicOrgProfilePage — Clerk OrganizationProfile for team management
export { MosaicOrgProfilePage } from "./components/auth/org-profile-page/MosaicOrgProfilePage.js";
export type { MosaicOrgProfilePageProps } from "./components/auth/org-profile-page/MosaicOrgProfilePage.js";

// ── T1.5: Multi-tenant (Clerk + cloud-identity peer) ─────────────────────────

// MosaicMultiTenantProvider — ClerkProvider + cloud-identity workspace-scope ctx
export {
  MosaicMultiTenantProvider,
  useMosaicWorkspace,
} from "./components/multi-tenant/multi-tenant-provider/MosaicMultiTenantProvider.js";
export type {
  MosaicMultiTenantProviderProps,
  MosaicWorkspaceContext,
} from "./components/multi-tenant/multi-tenant-provider/MosaicMultiTenantProvider.js";

// useEffectiveWorkspaceId — re-exposes cloud-identity workspace resolver hook
export { useEffectiveWorkspaceId } from "./components/multi-tenant/multi-tenant-provider/useEffectiveWorkspaceId.js";

// MosaicClerkWebhookHandler — Clerk → Convex sync (organization events)
export { MosaicClerkWebhookHandler } from "./components/multi-tenant/webhook-handler/MosaicClerkWebhookHandler.js";
export type {
  MosaicClerkWebhookHandlerOptions,
  MosaicClerkOrganization,
  MosaicClerkMembership,
} from "./components/multi-tenant/webhook-handler/MosaicClerkWebhookHandler.js";
