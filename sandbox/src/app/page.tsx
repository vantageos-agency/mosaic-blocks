"use client";

import {
  MosaicActivityFeed,
  MosaicAdaptiveGrid,
  MosaicAdaptiveModal,
  MosaicAdaptiveNavigation,
  MosaicAgentComposer,
  MosaicAnimatedList,
  MosaicAppSidebar,
  MosaicAvatar,
  MosaicBadge,
  MosaicBlurredOrb,
  MosaicButton,
  MosaicCard,
  MosaicCardContent,
  MosaicCardDescription,
  MosaicCardFooter,
  MosaicCardHeader,
  MosaicCardTitle,
  MosaicCombobox,
  MosaicCounter,
  MosaicDashboardLayout,
  MosaicDeviceProvider,
  MosaicDropdownMenu,
  MosaicFallingPattern,
  MosaicFeature3Col,
  MosaicFeatureCenteredMedia,
  MosaicField,
  MosaicFooterSimple,
  MosaicHeroSplit,
  MosaicInput,
  MosaicInputGroup,
  MosaicIntegrationsBadge,
  MosaicLogosGrid,
  MosaicModuleCard,
  MosaicNavbar,
  MosaicPricingCard,
  MosaicQuickActionCard,
  MosaicSelect,
  MosaicStatsGrid,
  MosaicSwitch,
  MosaicTestimonialsGrid,
  MosaicThemeToggle,
  Placeholder,
  version,
} from "@vantageos/mosaic-blocks";
import { useState } from "react";

function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <MosaicDeviceProvider>
      <MosaicButton onClick={() => setOpen(true)} variant="outline">
        Open Modal
      </MosaicButton>
      <MosaicAdaptiveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Adaptive Modal"
        description="Dialog on desktop, bottom sheet on mobile."
      >
        <p className="text-sm text-gray-600">
          This is the modal body. On mobile it slides up from the bottom.
        </p>
      </MosaicAdaptiveModal>
    </MosaicDeviceProvider>
  );
}

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* MosaicNavbar */}
      <MosaicNavbar
        logo={<span className="text-lg font-bold tracking-tight text-gray-900">Mosaic</span>}
        links={[
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
          { label: "Customers", href: "#customers" },
        ]}
        cta={{ label: "Get started", href: "#start" }}
        navAriaLabel="Main navigation"
        openMenuAriaLabel="Open menu"
        closeMenuAriaLabel="Close menu"
      />

      <main className="pt-24 space-y-0">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold mb-1">mosaic-blocks sandbox</h1>
          <p className="text-sm text-gray-500">
            v{version} — T3-A Batch A: 8 landing-section blocks
          </p>
        </div>

        {/* MosaicButton — atom (T0-ARCH, preserved across T3-A rebase) */}
        <section className="border-b border-gray-100 px-8 py-8">
          <p className="pb-3 text-xs font-mono text-gray-400 uppercase tracking-widest">
            MosaicButton — variants / sizes / states
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <MosaicButton variant="default">Default</MosaicButton>
            <MosaicButton variant="secondary">Secondary</MosaicButton>
            <MosaicButton variant="ghost">Ghost</MosaicButton>
            <MosaicButton variant="destructive">Destructive</MosaicButton>
            <MosaicButton variant="outline">Outline</MosaicButton>
            <MosaicButton variant="link">Link</MosaicButton>
            <MosaicButton size="sm">Small</MosaicButton>
            <MosaicButton size="lg">Large</MosaicButton>
            <MosaicButton size="icon" aria-label="Icon button">
              +
            </MosaicButton>
            <MosaicButton disabled>Disabled</MosaicButton>
          </div>
        </section>

        {/* MosaicHeroSplit */}
        <section className="border-b border-gray-100">
          <p className="px-8 pt-6 text-xs font-mono text-gray-400 uppercase tracking-widest">
            MosaicHeroSplit
          </p>
          <MosaicHeroSplit
            eyebrow="Now in beta"
            title="The platform built for modern product teams"
            subtitle="Ship faster, collaborate smarter, and keep every stakeholder aligned — without the enterprise overhead."
            cta={{ label: "Start free", href: "#start" }}
            ctaSecondary={{ label: "Watch demo", href: "#demo" }}
            media={
              <div className="w-full rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 aspect-video flex items-center justify-center text-gray-400 text-sm">
                Product screenshot slot
              </div>
            }
          />
        </section>

        {/* T4 — MosaicFeature3Col */}
        <section className="border-b border-gray-100" id="feature-3col">
          <p className="px-8 pt-6 text-xs font-mono text-gray-400 uppercase tracking-widest">
            MosaicFeature3Col — 3-column feature grid (T4)
          </p>
          <MosaicFeature3Col
            heading="Built for every team"
            subtext="From solo founders to enterprise engineering squads."
            features={[
              {
                id: "fc1",
                title: "Deploy in seconds",
                body: "Push to git and your changes are live. Zero config required.",
                icon: (
                  <span aria-hidden="true" className="text-xl">
                    ⚡
                  </span>
                ),
              },
              {
                id: "fc2",
                title: "Scales automatically",
                body: "Handle traffic spikes without lifting a finger. We manage the infra.",
                icon: (
                  <span aria-hidden="true" className="text-xl">
                    📈
                  </span>
                ),
              },
              {
                id: "fc3",
                title: "Secure by default",
                body: "SOC 2 Type II, GDPR compliant, encryption at rest and in transit.",
                icon: (
                  <span aria-hidden="true" className="text-xl">
                    🔒
                  </span>
                ),
              },
            ]}
          />
        </section>

        {/* MosaicLogosGrid — static */}
        <section className="border-b border-gray-100">
          <p className="px-8 pt-6 text-xs font-mono text-gray-400 uppercase tracking-widest">
            MosaicLogosGrid (static)
          </p>
          <MosaicLogosGrid
            heading="Trusted by teams at leading companies"
            logos={[
              {
                name: "Notion",
                src: "https://placehold.co/100x40/f3f4f6/9ca3af?text=Notion",
                width: 100,
                height: 40,
              },
              {
                name: "Framer",
                src: "https://placehold.co/100x40/f3f4f6/9ca3af?text=Framer",
                width: 100,
                height: 40,
              },
              {
                name: "Slack",
                src: "https://placehold.co/100x40/f3f4f6/9ca3af?text=Slack",
                width: 100,
                height: 40,
              },
              {
                name: "Webflow",
                src: "https://placehold.co/100x40/f3f4f6/9ca3af?text=Webflow",
                width: 100,
                height: 40,
              },
              {
                name: "Linear",
                src: "https://placehold.co/100x40/f3f4f6/9ca3af?text=Linear",
                width: 100,
                height: 40,
              },
            ]}
          />
        </section>

        {/* T4 — MosaicLogosGrid stagger variant */}
        <section className="border-b border-gray-100">
          <p className="px-8 pt-6 text-xs font-mono text-gray-400 uppercase tracking-widest">
            MosaicLogosGrid stagger=80 (T4 motion variant)
          </p>
          <MosaicLogosGrid
            heading="Animated stagger reveal"
            stagger={80}
            logos={[
              {
                name: "GitHub",
                src: "https://placehold.co/100x40/f3f4f6/9ca3af?text=GitHub",
                width: 100,
                height: 40,
              },
              {
                name: "Stripe",
                src: "https://placehold.co/100x40/f3f4f6/9ca3af?text=Stripe",
                width: 100,
                height: 40,
              },
              {
                name: "Vercel",
                src: "https://placehold.co/100x40/f3f4f6/9ca3af?text=Vercel",
                width: 100,
                height: 40,
              },
              {
                name: "Supabase",
                src: "https://placehold.co/100x40/f3f4f6/9ca3af?text=Supabase",
                width: 100,
                height: 40,
              },
            ]}
          />
        </section>

        {/* MosaicFeatureCenteredMedia */}
        <section className="border-b border-gray-100" id="features">
          <p className="px-8 pt-6 text-xs font-mono text-gray-400 uppercase tracking-widest">
            MosaicFeatureCenteredMedia
          </p>
          <MosaicFeatureCenteredMedia
            title="Everything your team needs"
            body="Built for speed. Designed to stay out of your way."
            features={[
              {
                id: "f1",
                title: "Real-time collaboration",
                description: "Every change syncs instantly across your team.",
              },
              {
                id: "f2",
                title: "Version history",
                description: "Roll back to any point in your project's history.",
              },
              {
                id: "f3",
                title: "Smart automations",
                description: "Automate repetitive work without writing code.",
              },
              {
                id: "f4",
                title: "Integrations",
                description: "Connects with the tools you already use.",
              },
            ]}
            media={
              <div className="w-full rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 aspect-video flex items-center justify-center text-gray-400 text-sm">
                Feature media slot
              </div>
            }
          />
        </section>

        {/* MosaicStatsGrid */}
        <section className="border-b border-gray-100">
          <p className="px-8 pt-6 text-xs font-mono text-gray-400 uppercase tracking-widest">
            MosaicStatsGrid
          </p>
          <MosaicStatsGrid
            heading="Numbers that speak for themselves"
            subtext="Trusted by thousands of teams shipping faster every day."
            stats={[
              { value: "12K+", label: "Active teams" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "3x", label: "Faster shipping" },
            ]}
          />
        </section>

        {/* MosaicTestimonialsGrid */}
        <section className="border-b border-gray-100" id="customers">
          <p className="px-8 pt-6 text-xs font-mono text-gray-400 uppercase tracking-widest">
            MosaicTestimonialsGrid
          </p>
          <MosaicTestimonialsGrid
            heading="Loved by thousands who work smarter"
            testimonials={[
              {
                id: "t1",
                quote:
                  "We onboarded 40 engineers in a week and saw immediate productivity gains. The tooling just gets out of the way and lets us focus on shipping.",
                author: "Sarah Chen",
                role: "VP of Engineering, Acme Corp",
              },
              {
                id: "t2",
                quote:
                  "Finally a tool that feels like it was built by people who actually ship code. Game changer.",
                author: "Marcus Thompson",
                role: "Lead Developer",
              },
              {
                id: "t3",
                quote: "Our clients notice the difference. We close projects 30% faster now.",
                author: "Jordan Patel",
                role: "Founder, Studio JP",
              },
            ]}
          />
        </section>

        {/* MosaicPricingCard — 3 cards */}
        <section className="border-b border-gray-100 px-8 py-16" id="pricing">
          <p className="pb-6 text-xs font-mono text-gray-400 uppercase tracking-widest">
            MosaicPricingCard (3-tier example)
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            <MosaicPricingCard
              tier="Free"
              price="$0/mo"
              features={["Up to 3 projects", "1 team member", "Community support"]}
              cta={{ label: "Start for free", href: "#free" }}
            />
            <MosaicPricingCard
              tier="Pro"
              price="$19/mo"
              features={[
                "Unlimited projects",
                "Up to 10 members",
                "Priority support",
                "Custom domain",
              ]}
              cta={{ label: "Get started", href: "#pro" }}
              highlighted
            />
            <MosaicPricingCard
              tier="Enterprise"
              price="Custom"
              features={[
                "Unlimited everything",
                "SSO / SAML",
                "Dedicated support",
                "SLA guarantee",
              ]}
              cta={{ label: "Contact sales", href: "#enterprise" }}
            />
          </div>
        </section>

        {/* ── T3-B Batch B: utility blocks ─────────────────────────────── */}
        <section className="border-t border-gray-100 px-8 py-10 space-y-8">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            T3-B Batch B — utility blocks
          </p>

          <div className="flex flex-wrap items-center gap-8">
            <MosaicCounter value={12000} />
            <MosaicCounter value={99} duration={1500} format={(v) => `${Math.round(v)}%`} />
            <MosaicThemeToggle />
            <MosaicIntegrationsBadge label="Stripe" />
            <MosaicIntegrationsBadge label="GitHub" href="https://github.com" />
          </div>

          <MosaicAnimatedList stagger={100} className="list-none space-y-2">
            <li>Staggered item one</li>
            <li>Staggered item two</li>
            <li>Staggered item three</li>
          </MosaicAnimatedList>

          <div className="relative h-40 overflow-hidden rounded-2xl border border-gray-100">
            <MosaicFallingPattern />
            <MosaicBlurredOrb position={{ top: "20%", left: "30%" }} />
            <span className="absolute inset-0 grid place-items-center text-sm text-gray-400">
              MosaicBlurredOrb + MosaicFallingPattern (decorative)
            </span>
          </div>
        </section>

        {/* ── T3-C Batch C: base-ui atoms ──────────────────────────────── */}
        <section className="border-t border-gray-100 px-8 py-10 space-y-6">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            T3-C Batch C — base-ui atoms
          </p>

          <div className="flex flex-wrap items-start gap-4">
            <MosaicBadge>Default</MosaicBadge>
            <MosaicBadge variant="secondary">Secondary</MosaicBadge>
            <MosaicBadge variant="destructive">Destructive</MosaicBadge>
            <MosaicBadge variant="outline">Outline</MosaicBadge>
            <MosaicAvatar
              src="https://placehold.co/64x64/ededed/9ca3af?text=AB"
              alt="Ada B."
              fallback="AB"
            />
            <MosaicSwitch aria-label="Toggle" defaultChecked />
            <MosaicSwitch aria-label="Disabled" disabled />
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <MosaicInput placeholder="Plain input" />
            <MosaicInputGroup prefix={<span className="px-2 text-gray-400">@</span>}>
              <MosaicInput placeholder="username" />
            </MosaicInputGroup>
            <MosaicSelect
              items={[
                { value: "react", label: "React" },
                { value: "preact", label: "Preact" },
              ]}
              placeholder="Pick a runtime"
            />
            <MosaicCombobox
              items={[
                { value: "ts", label: "TypeScript" },
                { value: "js", label: "JavaScript" },
              ]}
              placeholder="Search…"
            />
            <MosaicDropdownMenu
              trigger={<MosaicButton variant="outline">Open menu</MosaicButton>}
              items={[
                { id: "edit", label: "Edit" },
                { id: "delete", label: "Delete" },
              ]}
            />
          </div>

          <MosaicField className="w-64">
            <MosaicField.Label>Email</MosaicField.Label>
            <MosaicField.Control
              render={
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none"
                />
              }
            />
            <MosaicField.Description>We never share it.</MosaicField.Description>
          </MosaicField>

          <MosaicCard className="max-w-sm">
            <MosaicCardHeader>
              <MosaicCardTitle>Card title</MosaicCardTitle>
              <MosaicCardDescription>Composable card surface.</MosaicCardDescription>
            </MosaicCardHeader>
            <MosaicCardContent>Body content goes here.</MosaicCardContent>
            <MosaicCardFooter>
              <MosaicButton size="sm">Action</MosaicButton>
            </MosaicCardFooter>
          </MosaicCard>
        </section>

        {/* Placeholder (legacy) */}
        <section className="px-8 py-8">
          <Placeholder label="Alpha placeholder — T4+ blocks will extend this sandbox" />
        </section>

        {/* ── T3-D anydebate shell blocks ──────────────────────────────── */}
        <MosaicDeviceProvider>
          <section className="border-t border-gray-100 px-8 py-10 space-y-8">
            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
              T3-D — anydebate shell blocks (PC-01..PC-11)
            </p>

            {/* MosaicAdaptiveGrid */}
            <div>
              <p className="mb-3 text-xs font-mono text-gray-400">MosaicAdaptiveGrid</p>
              <MosaicAdaptiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={3}>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                  Cell 1
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                  Cell 2
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                  Cell 3
                </div>
              </MosaicAdaptiveGrid>
            </div>

            {/* MosaicAdaptiveNavigation */}
            <div>
              <p className="mb-3 text-xs font-mono text-gray-400">MosaicAdaptiveNavigation</p>
              <MosaicAdaptiveNavigation
                items={[
                  { id: "step1", title: "Setup", isComplete: true },
                  { id: "step2", title: "Configure", duration: 30 },
                  { id: "step3", title: "Deploy" },
                ]}
                activeItem="step2"
                onItemChange={() => {}}
              />
            </div>

            {/* MosaicAdaptiveModal — trigger */}
            <div>
              <p className="mb-3 text-xs font-mono text-gray-400">MosaicAdaptiveModal</p>
              <ModalDemo />
            </div>

            {/* MosaicAppSidebar */}
            <div>
              <p className="mb-3 text-xs font-mono text-gray-400">MosaicAppSidebar (collapsed)</p>
              <div className="flex h-64 rounded-xl border border-gray-200 overflow-hidden">
                <MosaicAppSidebar
                  isCollapsed={false}
                  onToggleCollapse={() => {}}
                  logoSlot={<span className="text-sm font-bold text-gray-800">Mosaic</span>}
                  navItems={[
                    { id: "home", label: "Home", href: "/" },
                    { id: "settings", label: "Settings", href: "/settings" },
                  ]}
                  footerStatus={{ label: "All systems go", sublabel: "Healthy" }}
                />
                <div className="flex-1 bg-gray-50 p-4 text-sm text-gray-500">Main content area</div>
              </div>
            </div>

            {/* MosaicQuickActionCard */}
            <div>
              <p className="mb-3 text-xs font-mono text-gray-400">MosaicQuickActionCard</p>
              <MosaicQuickActionCard
                heading="Quick Actions"
                actions={[
                  {
                    id: "create",
                    title: "Create",
                    description: "Start new item",
                    icon: <span>+</span>,
                    href: "#",
                    accent: "green",
                  },
                  {
                    id: "import",
                    title: "Import",
                    description: "Upload files",
                    icon: <span>↑</span>,
                    href: "#",
                    accent: "blue",
                  },
                  {
                    id: "export",
                    title: "Export",
                    description: "Download data",
                    icon: <span>↓</span>,
                    href: "#",
                    accent: "purple",
                  },
                  {
                    id: "share",
                    title: "Share",
                    description: "Invite team",
                    icon: <span>→</span>,
                    href: "#",
                    accent: "orange",
                  },
                ]}
              />
            </div>

            {/* MosaicActivityFeed */}
            <div>
              <p className="mb-3 text-xs font-mono text-gray-400">MosaicActivityFeed</p>
              <MosaicActivityFeed
                heading="Recent Activity"
                viewAllHref="#"
                activities={[
                  {
                    id: "a1",
                    type: "task",
                    title: "Report published",
                    description: "PDF export completed",
                    timestamp: "2h ago",
                    status: "completed",
                  },
                  {
                    id: "a2",
                    type: "task",
                    title: "Draft in progress",
                    description: "Working on v2",
                    timestamp: "5h ago",
                    status: "active",
                    participants: ["Alice", "Bob"],
                    messages: 12,
                  },
                  {
                    id: "a3",
                    type: "task",
                    title: "Old session",
                    description: "Marketing planning",
                    timestamp: "3 days ago",
                    status: "archived",
                  },
                ]}
              />
            </div>

            {/* MosaicModuleCard */}
            <div>
              <p className="mb-3 text-xs font-mono text-gray-400">MosaicModuleCard</p>
              <MosaicModuleCard
                type="role"
                module={{
                  name: "Product Manager",
                  description: "Drives product strategy and roadmap",
                  tags: ["strategy", "roadmap", "ux"],
                  icon: "🎯",
                }}
                onEdit={() => {}}
                onRemove={() => {}}
              />
            </div>

            {/* MosaicAgentComposer */}
            <div>
              <p className="mb-3 text-xs font-mono text-gray-400">
                MosaicAgentComposer (desktop 2-col)
              </p>
              <div className="h-[600px] rounded-xl border border-gray-200 overflow-hidden">
                <MosaicAgentComposer
                  agentName=""
                  onAgentNameChange={() => {}}
                  customInstructions=""
                  onCustomInstructionsChange={() => {}}
                  onSelectRole={() => {}}
                  onSelectPersona={() => {}}
                  onSelectFramework={() => {}}
                  onSelectModel={() => {}}
                  onRemoveRole={() => {}}
                  onRemovePersona={() => {}}
                  onRemoveFramework={() => {}}
                  onSave={() => {}}
                  canSave={false}
                />
              </div>
            </div>

            {/* MosaicDashboardLayout — rendered in a bounded iframe-like container */}
            <div>
              <p className="mb-3 text-xs font-mono text-gray-400">
                MosaicDashboardLayout (bounded preview)
              </p>
              <div className="h-[500px] rounded-xl border border-gray-200 overflow-hidden relative">
                <MosaicDashboardLayout
                  title="Dashboard"
                  subtitle="Overview of your workspace"
                  breadcrumbs={[{ label: "Home", href: "#" }, { label: "Dashboard" }]}
                  sidebarProps={{
                    logoSlot: <span className="text-sm font-bold">Mosaic</span>,
                    navItems: [
                      { id: "home", label: "Home", href: "/" },
                      { id: "analytics", label: "Analytics", href: "/analytics" },
                    ],
                  }}
                >
                  <p className="text-sm text-gray-500">Dashboard body — children render here.</p>
                </MosaicDashboardLayout>
              </div>
            </div>
          </section>
        </MosaicDeviceProvider>

        {/* MosaicFooterSimple */}
        <MosaicFooterSimple
          logo={<span className="text-lg font-bold tracking-tight text-gray-900">Mosaic</span>}
          columns={[
            {
              id: "col-product",
              heading: "Product",
              links: [
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Changelog", href: "#changelog" },
              ],
            },
            {
              id: "col-company",
              heading: "Company",
              links: [
                { label: "About", href: "#about" },
                { label: "Blog", href: "#blog" },
                { label: "Careers", href: "#careers" },
              ],
            },
            {
              id: "col-legal",
              heading: "Legal",
              links: [
                { label: "Privacy", href: "#privacy" },
                { label: "Terms", href: "#terms" },
              ],
            },
          ]}
          social={[
            { label: "Twitter / X", href: "https://x.com" },
            { label: "GitHub", href: "https://github.com" },
            { label: "LinkedIn", href: "https://linkedin.com" },
          ]}
          legal={`© ${new Date().getFullYear()} VantageOS. All rights reserved.`}
        />
      </main>
    </div>
  );
}
