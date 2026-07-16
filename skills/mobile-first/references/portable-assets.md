# Portable reference assets

A production-tested reference implementation of this architecture exists in
an internal repository (ask the orchestrator for access). When a project
needs one of these capabilities, PORT the file — do not rewrite it.

| Asset | File | Provides |
| --- | --- | --- |
| Breakpoint config | `config/responsive.ts` | `BREAKPOINTS`, `DEVICE_BREAKPOINTS`, `Breakpoint`, `DeviceType` (320/768/1024) |
| Device context | `contexts/DeviceProvider.tsx` | `DeviceProvider`, `useDevice()` → `{ isMobile, isTablet, isDesktop, viewport, orientation }` |
| Breakpoint hook | `hooks/responsive/useBreakpoint.ts` | `useBreakpoint()`, `useIsMobile()`, `useIsTablet()`, `useIsDesktop()` |
| Orientation hook | `hooks/responsive/useOrientation.ts` | portrait/landscape detection |
| Viewport hook | `hooks/responsive/useViewport.ts` | debounced viewport dimensions |
| Reduced motion | `hooks/use-reduced-motion.ts` | `useReducedMotion()` accessibility preference |
| Adaptive grid | `components/adaptive/AdaptiveGrid.tsx` | 1 column mobile / 2-3 columns desktop |
| Adaptive modal | `components/adaptive/AdaptiveModal.tsx` | bottom drawer mobile / centered modal desktop |
| Adaptive navigation | `components/adaptive/AdaptiveNavigation.tsx` | accordion mobile / horizontal tabs desktop |

Usage pattern:

```tsx
import { useDevice } from "@/contexts/DeviceProvider"

function MyComponent() {
  const { isMobile } = useDevice()
  return isMobile ? <MobileView /> : <DesktopView />
}
```

Porting order for a new app: breakpoint config → DeviceProvider (mounted in
the root layout) → hooks → adaptive components as needed.
