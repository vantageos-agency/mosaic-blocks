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

// ── #20: MosaicSkeleton ──────────────────────────────────────────────────────
export { MosaicSkeleton } from "./components/skeleton/MosaicSkeleton.js";
export type { MosaicSkeletonProps } from "./components/skeleton/MosaicSkeleton.js";
export { skeletonVariants } from "./components/skeleton/skeleton-variants.js";

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

// ── #21: MosaicFilterBar ─────────────────────────────────────────────────────
export { MosaicFilterBar } from "./components/filter-bar/MosaicFilterBar.js";
export type { MosaicFilterBarProps } from "./components/filter-bar/MosaicFilterBar.js";

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
export {
  MosaicTooltip,
  MosaicTooltipProvider,
  MosaicTooltipRoot,
  MosaicTooltipTrigger,
  MosaicTooltipContent,
  Tooltip,
} from "./components/tooltip/MosaicTooltip.js";
export type {
  MosaicTooltipProps,
  MosaicTooltipProviderProps,
  MosaicTooltipRootProps,
  MosaicTooltipTriggerProps,
  MosaicTooltipContentProps,
} from "./components/tooltip/MosaicTooltip.js";

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

// ModelSelector (@base-ui/react/combobox) — host-owned model catalogue
export { MosaicModelSelector } from "./components/model-selector/MosaicModelSelector.js";
export type {
  MosaicModelOption,
  MosaicModelSelectorProps,
} from "./components/model-selector/MosaicModelSelector.js";

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

// AgentEditor — agent config form (name / role / instructions), fully host-controlled
export { MosaicAgentEditor } from "./components/agent-editor/MosaicAgentEditor.js";
export type { MosaicAgentEditorProps } from "./components/agent-editor/MosaicAgentEditor.js";
export { agentEditorVariants } from "./components/agent-editor/agent-editor-variants.js";

// AgentBuilderModal — modal shell to compose/configure an agent, confirm or cancel; body is host-owned
export { MosaicAgentBuilderModal } from "./components/agent-builder-modal/MosaicAgentBuilderModal.js";
export type { MosaicAgentBuilderModalProps } from "./components/agent-builder-modal/MosaicAgentBuilderModal.js";
export {
  agentBuilderModalBackdropVariants,
  agentBuilderModalPopupVariants,
} from "./components/agent-builder-modal/agent-builder-modal-variants.js";

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

// MosaicAlertDialog — confirm-before-irreversible-action dialog (compound API)
export {
  MosaicAlertDialog,
  MosaicAlertDialogAction,
  MosaicAlertDialogCancel,
  MosaicAlertDialogContent,
  MosaicAlertDialogDescription,
  MosaicAlertDialogFooter,
  MosaicAlertDialogHeader,
  MosaicAlertDialogOverlay,
  MosaicAlertDialogPortal,
  MosaicAlertDialogTitle,
  MosaicAlertDialogTrigger,
} from "./components/alert-dialog/MosaicAlertDialog.js";
export type {
  MosaicAlertDialogActionProps,
  MosaicAlertDialogCancelProps,
  MosaicAlertDialogContentProps,
  MosaicAlertDialogDescriptionProps,
  MosaicAlertDialogOverlayProps,
  MosaicAlertDialogTitleProps,
} from "./components/alert-dialog/MosaicAlertDialog.js";
export {
  alertDialogContentVariants,
  alertDialogOverlayVariants,
} from "./components/alert-dialog/alert-dialog-variants.js";

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

// MosaicAgentPreview — presentational preview of an agent config before creation
export { MosaicAgentPreview } from "./components/agent-preview/MosaicAgentPreview.js";
export type {
  MosaicAgentPreviewProps,
  MosaicAgentPreviewSummaryProps,
  MosaicAgentPreviewDetailedProps,
  MosaicAgentPreviewAttribute,
} from "./components/agent-preview/MosaicAgentPreview.js";
export { agentPreviewVariants } from "./components/agent-preview/agent-preview-variants.js";

// MosaicMemoryCard — memory item card (detailed / compact variants)
export { MosaicMemoryCard } from "./components/memory-card/MosaicMemoryCard.js";
export type {
  MosaicMemoryCardProps,
  MosaicMemoryData,
  MosaicMemoryScope,
  MosaicMemorySource,
} from "./components/memory-card/MosaicMemoryCard.js";

// MosaicMemoryDashboard — knowledge-base landing surface (header + stats + search slot + view toggle + results slot)
export { MosaicMemoryDashboard } from "./components/memory-dashboard/MosaicMemoryDashboard.js";
export type {
  MosaicMemoryDashboardProps,
  MosaicMemoryDashboardStat,
  MosaicMemoryDashboardViewMode,
} from "./components/memory-dashboard/MosaicMemoryDashboard.js";
export { memoryDashboardViewToggleButtonVariants } from "./components/memory-dashboard/memory-dashboard-variants.js";

// MosaicTemplateAgentCard — agent-type template preview card
export { MosaicTemplateAgentCard } from "./components/template-agent-card/MosaicTemplateAgentCard.js";
export type {
  MosaicTemplateAgentCardProps,
  MosaicTemplateAgentData,
} from "./components/template-agent-card/MosaicTemplateAgentCard.js";
export {
  templateAgentCardBadgeVariants,
  templateAgentCardTagVariants,
  templateAgentCardVariants,
} from "./components/template-agent-card/template-agent-card-variants.js";

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

// MosaicMarketplaceCard (M1) — standalone agent-type gallery tile
export { MosaicMarketplaceCard } from "./components/marketplace-card/MosaicMarketplaceCard.js";
export type { MosaicMarketplaceCardProps } from "./components/marketplace-card/MosaicMarketplaceCard.js";
export { marketplaceCardVariants } from "./components/marketplace-card/marketplace-card-variants.js";

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

// ── #23: MosaicDataTable ─────────────────────────────────────────────────────
export { MosaicDataTable } from "./components/data-table/MosaicDataTable.js";
export type {
  MosaicDataTableProps,
  MosaicDataTableColumn,
  MosaicDataTablePagination,
} from "./components/data-table/MosaicDataTable.js";

// ── #22: MosaicStepPipeline / #43: segment-bar variant ──────────────────────
export { MosaicStepPipeline } from "./components/step-pipeline/MosaicStepPipeline.js";
export type {
  MosaicStepPipelineProps,
  MosaicStepPipelineDotsProps,
  MosaicStepPipelineSegmentsProps,
  MosaicStep,
  MosaicStepStatus,
} from "./components/step-pipeline/MosaicStepPipeline.js";

// ── #18: MosaicKanban ────────────────────────────────────────────────────────
export { MosaicKanbanBoard } from "./components/kanban/MosaicKanbanBoard.js";
export type { MosaicKanbanBoardProps } from "./components/kanban/MosaicKanbanBoard.js";

export { MosaicKanbanColumn } from "./components/kanban/MosaicKanbanColumn.js";
export type { MosaicKanbanColumnProps } from "./components/kanban/MosaicKanbanColumn.js";

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

// ── T8: MosaicDocumentUpload — presentational document drop-zone + status list ──
export { MosaicDocumentUpload } from "./components/document-upload/MosaicDocumentUpload.js";
export type {
  MosaicDocumentUploadProps,
  MosaicDocumentUploadFile,
  MosaicDocumentUploadFileStatus,
} from "./components/document-upload/MosaicDocumentUpload.js";

// ── T9: MosaicUrlScraper — presentational URL input + scraped-content preview ──
export { MosaicUrlScraper } from "./components/url-scraper/MosaicUrlScraper.js";
export type {
  MosaicUrlScraperProps,
  MosaicUrlScraperContent,
  MosaicUrlScraperState,
} from "./components/url-scraper/MosaicUrlScraper.js";

// ── MVP-1: MosaicChatThread — presentational auto-scrolling chat stream ──────
export { MosaicChatThread } from "./components/chat-thread/MosaicChatThread.js";
export type { MosaicChatThreadProps } from "./components/chat-thread/MosaicChatThread.js";

// ── T10: MosaicChatComposer — presentational chat input + send/stop button ──
export { MosaicChatComposer } from "./components/chat-composer/MosaicChatComposer.js";
export type {
  MosaicChatComposerProps,
  MosaicChatComposerState,
} from "./components/chat-composer/MosaicChatComposer.js";

// ── MosaicMarkdown — presentational, dependency-free markdown renderer ──────
export { MosaicMarkdown } from "./components/markdown/MosaicMarkdown.js";
export type { MosaicMarkdownProps } from "./components/markdown/MosaicMarkdown.js";

// ── MVP-2: MosaicChatMessage — presentational chat message (role + parts) ──
export { MosaicChatMessage } from "./components/chat-message/MosaicChatMessage.js";
export type {
  MosaicChatMessageProps,
  MosaicChatMessageSenderRole,
  MosaicChatMessagePart,
  MosaicChatMessageTextPart,
  MosaicChatMessageReasoningPart,
  MosaicChatMessageToolPart,
  MosaicChatMessageToolState,
  MosaicChatMessageToolStatusLabels,
  MosaicChatMessageAttachmentPart,
} from "./components/chat-message/MosaicChatMessage.js";
export {
  chatMessageBubbleVariants,
  chatMessageContainerVariants,
  chatMessageToolStatusVariants,
} from "./components/chat-message/chat-message-variants.js";

// ── MVP-3: MosaicApprovalPrompt — "reprendre la main" tool-call approve/deny ──
export { MosaicApprovalPrompt } from "./components/approval-prompt/MosaicApprovalPrompt.js";
export type {
  MosaicApprovalPromptProps,
  MosaicApprovalPromptState,
} from "./components/approval-prompt/MosaicApprovalPrompt.js";

// ── MVP-4: MosaicToolToggleList — per-tool switch + approval-level selector ──
export { MosaicToolToggleList } from "./components/tool-toggle-list/MosaicToolToggleList.js";
export type {
  MosaicToolToggleListProps,
  MosaicToolToggleListApprovalLevel,
  MosaicToolToggleListSection,
  MosaicToolToggleListTool,
} from "./components/tool-toggle-list/MosaicToolToggleList.js";
export {
  toolToggleListRowVariants,
  toolToggleListSectionVariants,
} from "./components/tool-toggle-list/tool-toggle-list-variants.js";

// ── MVP-5: MosaicApiKeyPanel — presentational BYOK (bring your own key) panel ──
export { MosaicApiKeyPanel } from "./components/api-key-panel/MosaicApiKeyPanel.js";
export type {
  MosaicApiKeyPanelProps,
  MosaicApiKeyPanelProvider,
  MosaicApiKeyPanelState,
} from "./components/api-key-panel/MosaicApiKeyPanel.js";

// ── MVP-8: MosaicAgentChat — presentational session harness ─────────────────
export { MosaicAgentChat } from "./components/agent-chat/MosaicAgentChat.js";
export type {
  MosaicAgentChatProps,
  MosaicAgentChatState,
  MosaicAgentChatMessage,
  MosaicAgentChatMessagePart,
  MosaicAgentChatToolPart,
  MosaicAgentChatToolPartState,
  MosaicAgentChatApprovalRequest,
  MosaicAgentChatApprovalLabels,
  MosaicAgentChatApprovalResponsePayload,
} from "./components/agent-chat/MosaicAgentChat.js";
export { agentChatRootVariants } from "./components/agent-chat/agent-chat-variants.js";

// ── UC2-1: MosaicToast + MosaicToastProvider — ephemeral notifications ──────
export { MosaicToast } from "./components/toast/MosaicToast.js";
export type { MosaicToastProps, MosaicToastVariant } from "./components/toast/MosaicToast.js";
export { MosaicToastProvider } from "./components/toast/MosaicToastProvider.js";
export type {
  MosaicToastProviderProps,
  MosaicToastProviderPosition,
} from "./components/toast/MosaicToastProvider.js";
export {
  toastCardVariants,
  toastDismissButtonVariants,
  toastProviderPositionVariants,
  toastTitleVariants,
} from "./components/toast/toast-variants.js";

// ── UC2-2: MosaicPdfViewer — presentational inline PDF preview ─────────────
export { MosaicPdfViewer } from "./components/pdf-viewer/MosaicPdfViewer.js";
export type { MosaicPdfViewerProps } from "./components/pdf-viewer/MosaicPdfViewer.js";
export {
  pdfViewerFrameVariants,
  pdfViewerStatusVariants,
  pdfViewerToolbarButtonVariants,
} from "./components/pdf-viewer/pdf-viewer-variants.js";

// ── UC2-3: MosaicResizableSplitPane — resizable content-split layout ───────
export { MosaicResizableSplitPane } from "./components/resizable-split-pane/MosaicResizableSplitPane.js";
export type { MosaicResizableSplitPaneProps } from "./components/resizable-split-pane/MosaicResizableSplitPane.js";
export {
  splitPaneCollapseButtonVariants,
  splitPaneHandleVariants,
  splitPaneRootVariants,
} from "./components/resizable-split-pane/split-pane-variants.js";

// ── UC2-4: MosaicTagInput — presentational tag/chip input with autocomplete ─
export { MosaicTagInput } from "./components/tag-input/MosaicTagInput.js";
export type { MosaicTagInputProps } from "./components/tag-input/MosaicTagInput.js";
export {
  tagInputFieldVariants,
  tagInputRemoveButtonVariants,
  tagInputRootVariants,
  tagInputTagVariants,
} from "./components/tag-input/tag-input-variants.js";

// ── M1: MosaicDrawer — controlled side panel for record detail ─────────────
export { MosaicDrawer } from "./components/drawer/MosaicDrawer.js";
export type { MosaicDrawerProps } from "./components/drawer/MosaicDrawer.js";
export {
  drawerBackdropVariants,
  drawerPopupVariants,
} from "./components/drawer/drawer-variants.js";

// ── M1: MosaicPopover — anchored floating panel ─────────────────────────────
export { MosaicPopover } from "./components/popover/MosaicPopover.js";
export type { MosaicPopoverProps } from "./components/popover/MosaicPopover.js";
export { popoverPopupVariants } from "./components/popover/popover-variants.js";

// ── M1: MosaicTemplateCategoryChips — host-driven agent-template filter ───
export { MosaicTemplateCategoryChips } from "./components/template-category-chips/MosaicTemplateCategoryChips.js";
export type {
  MosaicTemplateCategory,
  MosaicTemplateCategoryChipsProps,
} from "./components/template-category-chips/MosaicTemplateCategoryChips.js";
export { templateCategoryChipVariants } from "./components/template-category-chips/template-category-chips-variants.js";

// ── MosaicEditMemoryDialog — correct a stale memory: content/type/tags ─────
export { MosaicEditMemoryDialog } from "./components/edit-memory-dialog/MosaicEditMemoryDialog.js";
export type { MosaicEditMemoryDialogProps } from "./components/edit-memory-dialog/MosaicEditMemoryDialog.js";
export {
  editMemoryDialogBackdropVariants,
  editMemoryDialogErrorVariants,
  editMemoryDialogFieldVariants,
  editMemoryDialogPopupVariants,
} from "./components/edit-memory-dialog/edit-memory-dialog-variants.js";

// ── M1: MosaicSaveTemplateModal — presentational "save as template" form modal ─
export { MosaicSaveTemplateModal } from "./components/save-template-modal/MosaicSaveTemplateModal.js";
export type { MosaicSaveTemplateModalProps } from "./components/save-template-modal/MosaicSaveTemplateModal.js";
export {
  saveTemplateModalBodyVariants,
  saveTemplateModalButtonVariants,
  saveTemplateModalErrorVariants,
  saveTemplateModalFieldVariants,
  saveTemplateModalFooterVariants,
} from "./components/save-template-modal/save-template-modal-variants.js";

// ── M1: MosaicAddMemoryForm — presentational "record a new memory" form ────
export { MosaicAddMemoryForm } from "./components/add-memory-form/MosaicAddMemoryForm.js";
export type { MosaicAddMemoryFormProps } from "./components/add-memory-form/MosaicAddMemoryForm.js";
export {
  addMemoryFormButtonVariants,
  addMemoryFormErrorVariants,
  addMemoryFormFieldVariants,
  addMemoryFormFooterVariants,
  addMemoryFormRootVariants,
} from "./components/add-memory-form/add-memory-form-variants.js";

// ── M1: MosaicTemplateList — presentational, disposition-only item list ────
export { MosaicTemplateList } from "./components/template-list/MosaicTemplateList.js";
export type { MosaicTemplateListProps } from "./components/template-list/MosaicTemplateList.js";
export { templateListVariants } from "./components/template-list/template-list-variants.js";

// ── M1: MosaicTemplateManagementPanel — rename/duplicate/delete saved templates ──
export { MosaicTemplateManagementPanel } from "./components/template-management-panel/MosaicTemplateManagementPanel.js";
export type {
  MosaicTemplateManagementItem,
  MosaicTemplateManagementPanelProps,
} from "./components/template-management-panel/MosaicTemplateManagementPanel.js";
export { templateManagementRowVariants } from "./components/template-management-panel/template-management-panel-variants.js";

// ── M1: MosaicChatSidebar — presentational, disposition-only thread column ─
export { MosaicChatSidebar } from "./components/chat-sidebar/MosaicChatSidebar.js";
export type { MosaicChatSidebarProps } from "./components/chat-sidebar/MosaicChatSidebar.js";
export { chatSidebarThreadVariants } from "./components/chat-sidebar/chat-sidebar-variants.js";

// ── M1: MosaicMemoryGrid — presentational, tile-disposition-only knowledge-base grid ──
export { MosaicMemoryGrid } from "./components/memory-grid/MosaicMemoryGrid.js";
export type { MosaicMemoryGridProps } from "./components/memory-grid/MosaicMemoryGrid.js";
export { memoryGridVariants } from "./components/memory-grid/memory-grid-variants.js";

// ── M1: MosaicMemoryList — presentational, row-disposition-only knowledge-base list ──
export { MosaicMemoryList } from "./components/memory-list/MosaicMemoryList.js";
export type { MosaicMemoryListProps } from "./components/memory-list/MosaicMemoryList.js";
export {
  memoryListItemVariants,
  memoryListVariants,
} from "./components/memory-list/memory-list-variants.js";
