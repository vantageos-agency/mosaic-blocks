import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicMultiTenantProvider, useMosaicWorkspace } from "./MosaicMultiTenantProvider.js";
import { useEffectiveWorkspaceId } from "./useEffectiveWorkspaceId.js";

// ── Mock Clerk ClerkProvider ──────────────────────────────────────────────────

function MockClerkProvider({
  children,
  publishableKey,
}: {
  children?: React.ReactNode;
  publishableKey?: string;
  appearance?: Record<string, unknown>;
}) {
  return (
    <div data-testid="clerk-provider" data-pub-key={publishableKey}>
      {children}
    </div>
  );
}

// ── Consumer component for context testing ────────────────────────────────────

function WorkspaceConsumer() {
  const { workspaceId, isLoading } = useMosaicWorkspace();
  return (
    <div
      data-testid="workspace-consumer"
      data-workspace-id={workspaceId ?? "null"}
      data-loading={String(isLoading)}
    />
  );
}

function HookConsumer() {
  const { workspaceId } = useEffectiveWorkspaceId();
  return <div data-testid="hook-consumer" data-workspace-id={workspaceId ?? "null"} />;
}

describe("MosaicMultiTenantProvider", () => {
  it("renders without crashing", () => {
    const { unmount } = render(
      <MosaicMultiTenantProvider clerkProvider={MockClerkProvider} publishableKey="pk_test_xxx">
        <div />
      </MosaicMultiTenantProvider>,
    );
    unmount();
  });

  it("renders children wrapped in Clerk provider", () => {
    render(
      <MosaicMultiTenantProvider clerkProvider={MockClerkProvider}>
        <span data-testid="child">Hello</span>
      </MosaicMultiTenantProvider>,
    );
    expect(screen.getByTestId("child")).toBeTruthy();
    expect(screen.getByTestId("clerk-provider")).toBeTruthy();
  });

  it("passes publishableKey to Clerk provider", () => {
    render(
      <MosaicMultiTenantProvider clerkProvider={MockClerkProvider} publishableKey="pk_test_abc">
        <div />
      </MosaicMultiTenantProvider>,
    );
    expect(screen.getByTestId("clerk-provider").getAttribute("data-pub-key")).toBe("pk_test_abc");
  });

  it("provides workspace context with initialOrgId", async () => {
    render(
      <MosaicMultiTenantProvider clerkProvider={MockClerkProvider} initialOrgId="org_123">
        <WorkspaceConsumer />
      </MosaicMultiTenantProvider>,
    );
    await waitFor(() => {
      const el = screen.getByTestId("workspace-consumer");
      expect(el.getAttribute("data-workspace-id")).toBe("org_123");
    });
  });

  it("resolves workspaceId via resolveWorkspaceId async function", async () => {
    const resolver = async (_orgId: string | null) => "resolved-ws-42";
    render(
      <MosaicMultiTenantProvider
        clerkProvider={MockClerkProvider}
        initialOrgId="org_original"
        resolveWorkspaceId={resolver}
      >
        <WorkspaceConsumer />
      </MosaicMultiTenantProvider>,
    );
    await waitFor(() => {
      const el = screen.getByTestId("workspace-consumer");
      expect(el.getAttribute("data-workspace-id")).toBe("resolved-ws-42");
    });
  });

  it("renders data-slot on inner wrapper", () => {
    const { container } = render(
      <MosaicMultiTenantProvider clerkProvider={MockClerkProvider}>
        <div />
      </MosaicMultiTenantProvider>,
    );
    expect(container.querySelector('[data-slot="multi-tenant-provider"]')).toBeTruthy();
  });

  it("provides default null workspaceId when no initialOrgId", async () => {
    render(
      <MosaicMultiTenantProvider clerkProvider={MockClerkProvider}>
        <WorkspaceConsumer />
      </MosaicMultiTenantProvider>,
    );
    await waitFor(() => {
      const el = screen.getByTestId("workspace-consumer");
      expect(el.getAttribute("data-workspace-id")).toBe("null");
    });
  });

  it("useEffectiveWorkspaceId re-export works correctly", async () => {
    render(
      <MosaicMultiTenantProvider clerkProvider={MockClerkProvider} initialOrgId="org_hook">
        <HookConsumer />
      </MosaicMultiTenantProvider>,
    );
    await waitFor(() => {
      const el = screen.getByTestId("hook-consumer");
      expect(el.getAttribute("data-workspace-id")).toBe("org_hook");
    });
  });

  it("useEffectiveWorkspaceId returns null outside provider (default context)", () => {
    render(<HookConsumer />);
    const el = screen.getByTestId("hook-consumer");
    expect(el.getAttribute("data-workspace-id")).toBe("null");
  });
});
