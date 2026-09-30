/**
 * Refusal vs empty result on ONE screen.
 *
 * The screen is a guarded list: `MosaicAdminOnlyGuard` wraps a list that shows
 * `MosaicEmptyState` when it has no rows. The only variable between the two
 * renders is `isAdmin`; the data (zero rows) is identical. A denial must not
 * render as an absence: "you may not" and "there is nothing" are different facts.
 *
 * Guard states, derived from MosaicAdminOnlyGuard.tsx: loading (isLoaded=false),
 * denied (!isAdmin), children (isAdmin). Three, not two — the loading state is
 * asserted to be neither of the two poles.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicEmptyState } from "../empty-state/MosaicEmptyState.js";
import { MosaicAdminOnlyGuard } from "./MosaicAdminOnlyGuard.js";

const DENIED_TITLE = "Admin Access Required";
const DENIED_ROLE = "Required role: Admin";
const EMPTY_TITLE = "No members yet";

function Screen({
  isAdmin,
  isLoaded = true,
  rows = [],
}: {
  isAdmin: boolean;
  isLoaded?: boolean;
  rows?: string[];
}) {
  return (
    <MosaicAdminOnlyGuard
      isAdmin={isAdmin}
      isLoaded={isLoaded}
      title={DENIED_TITLE}
      description="Only organization administrators can view members."
      requiredRoleLabel={DENIED_ROLE}
    >
      {rows.length === 0 ? (
        <MosaicEmptyState title={EMPTY_TITLE} description="Invite someone to get started." />
      ) : (
        <ul data-slot="member-list">
          {rows.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </MosaicAdminOnlyGuard>
  );
}

const slot = (c: HTMLElement, name: string) => c.querySelectorAll(`[data-slot="${name}"]`).length;

describe("refusal and empty result are distinguishable on one screen", () => {
  it("renders a refusal (non-admin, zero rows) as a refusal, not as an empty state", () => {
    const { container } = render(<Screen isAdmin={false} />);
    expect(slot(container, "admin-only-guard")).toBe(1);
    expect(slot(container, "empty-state")).toBe(0);
    expect(container.querySelector("h2")?.textContent).toBe(DENIED_TITLE);
    expect(container.textContent).toContain(DENIED_ROLE);
    expect(container.textContent).not.toContain(EMPTY_TITLE);
  });

  it("renders an empty result (admin, zero rows) as an empty state, not as a refusal", () => {
    const { container } = render(<Screen isAdmin />);
    expect(slot(container, "empty-state")).toBe(1);
    expect(slot(container, "admin-only-guard")).toBe(0);
    expect(container.querySelector("h3")?.textContent).toBe(EMPTY_TITLE);
    expect(container.textContent).not.toContain(DENIED_TITLE);
    expect(container.textContent).not.toContain(DENIED_ROLE);
  });

  it("the two outputs differ, and differ in text, not only in markup", () => {
    const refused = render(<Screen isAdmin={false} />);
    const refusedHtml = refused.container.innerHTML;
    const refusedText = refused.container.textContent;
    refused.unmount();
    const empty = render(<Screen isAdmin />);
    expect(empty.container.innerHTML).not.toBe(refusedHtml);
    expect(empty.container.textContent).not.toBe(refusedText);
    expect(refusedHtml.length).toBeGreaterThan(0);
    expect(empty.container.innerHTML.length).toBeGreaterThan(0);
  });

  it("a refusal is not blank: it carries visible text", () => {
    const { container } = render(<Screen isAdmin={false} />);
    expect((container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });

  it("loading is neither pole", () => {
    const { container } = render(<Screen isAdmin={false} isLoaded={false} />);
    expect(slot(container, "admin-only-guard-loading")).toBe(1);
    expect(slot(container, "admin-only-guard")).toBe(0);
    expect(slot(container, "empty-state")).toBe(0);
  });
});
