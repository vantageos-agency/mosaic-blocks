# Decision trees

## 1. Which responsive approach?

```
START: Need responsive behavior?
Q1: Is it just layout/styling?
    YES → Tailwind responsive classes (sm:, md:, lg:)
Q2: Same content, different presentation?
    YES → Adaptive component (AdaptiveModal, AdaptiveNavigation)
Q3: Fundamentally different UX?
    YES → Separate mobile/desktop components
Q4: Feature only makes sense on one device type?
    YES → Conditional rendering {!isMobile && <Feature />}
    NO  → Reconsider — probably a CSS-only solution
```

## 2. Touch target sizing

```
Q1: Button, link, or clickable element?
    YES → minimum 44×44px (WCAG 2.1 Level AA)
Q2: Form input?
    YES → minimum 48px height (prevents iOS auto-zoom)
Q3: Card or list item?
    YES → minimum 80px height for comfortable tapping
    NO  → standard sizing OK
Spacing between adjacent targets: ≥8px.
```

## 3. Modal vs drawer

```
Q1: Content is form-based or requires input?
    YES → adaptive modal (drawer on mobile — keyboard behaves better)
Q2: Content is tall / scrollable?
    YES → adaptive modal (drawer on mobile — better scrolling)
Q3: Simple, quick action?
    YES → dialog on all devices
    NO  → adaptive modal (best of both worlds)
```

## The four systems in detail

1. **Responsive CSS** — Tailwind classes, mobile base first
   (`w-full md:w-1/2`). No device detection. Cheapest; prefer it whenever
   only layout changes.
2. **Adaptive component** — one component, `useDevice()` inside, two
   renderings. Examples: modal↔drawer, tabs↔accordion, 1-column↔3-column
   grid.
3. **Separate components** — `mobile/` and `desktop/` files with a shared
   core. For different interaction patterns (tap-to-expand vs hover-preview,
   full-screen vs split-view) and for loading only what the device needs.
4. **Conditional rendering** — `{isMobile && <PullToRefresh />}`,
   `{!isMobile && <KeyboardShortcuts />}`. Device-exclusive features only;
   core functionality must exist on every device.
