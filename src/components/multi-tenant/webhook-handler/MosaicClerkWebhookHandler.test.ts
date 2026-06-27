import { describe, expect, it, vi } from "vitest";
import {
  MosaicClerkWebhookHandler,
  type MosaicClerkWebhookHandlerOptions,
} from "./MosaicClerkWebhookHandler.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSvixHeaders() {
  return {
    "svix-id": "msg_abc",
    "svix-timestamp": "1234567890",
    "svix-signature": "v1,abc123",
  };
}

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/webhooks/clerk", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json", ...makeSvixHeaders(), ...headers },
  });
}

// ── Mock svix ─────────────────────────────────────────────────────────────────

vi.mock("svix", () => ({
  Webhook: class MockWebhook {
    verify(_body: string, _headers: Record<string, string>) {
      const payload = JSON.parse(_body) as {
        type: string;
        data: Record<string, unknown>;
      };
      return payload;
    }
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MosaicClerkWebhookHandler", () => {
  it("returns 200 for organization.created event", async () => {
    const body = JSON.stringify({
      type: "organization.created",
      data: { id: "org_1", name: "Acme", slug: "acme" },
    });
    const req = makeRequest(body);
    const onOrganizationCreated = vi.fn();
    const opts: MosaicClerkWebhookHandlerOptions = {
      webhookSecret: "whsec_test",
      onOrganizationCreated,
    };
    const res = await MosaicClerkWebhookHandler(req, opts);
    expect(res.status).toBe(200);
    expect(onOrganizationCreated).toHaveBeenCalledOnce();
  });

  it("returns 200 for organizationMembership.created event", async () => {
    const body = JSON.stringify({
      type: "organizationMembership.created",
      data: {
        id: "mem_1",
        role: "org:member",
        organization: { id: "org_1", name: "Acme", slug: "acme" },
        publicUserData: { userId: "user_1", firstName: "Alice", lastName: "Smith" },
      },
    });
    const req = makeRequest(body);
    const onMembershipCreated = vi.fn();
    const opts: MosaicClerkWebhookHandlerOptions = {
      webhookSecret: "whsec_test",
      onMembershipCreated,
    };
    const res = await MosaicClerkWebhookHandler(req, opts);
    expect(res.status).toBe(200);
    expect(onMembershipCreated).toHaveBeenCalledOnce();
  });

  it("returns 200 for organizationMembership.deleted event", async () => {
    const body = JSON.stringify({
      type: "organizationMembership.deleted",
      data: {
        id: "mem_1",
        role: "org:member",
        organization: { id: "org_1", name: "Acme", slug: "acme" },
        publicUserData: { userId: "user_1", firstName: "Alice", lastName: "Smith" },
      },
    });
    const req = makeRequest(body);
    const onMembershipDeleted = vi.fn();
    const opts: MosaicClerkWebhookHandlerOptions = {
      webhookSecret: "whsec_test",
      onMembershipDeleted,
    };
    const res = await MosaicClerkWebhookHandler(req, opts);
    expect(res.status).toBe(200);
    expect(onMembershipDeleted).toHaveBeenCalledOnce();
  });

  it("returns 200 for unknown event type (graceful ignore)", async () => {
    const body = JSON.stringify({ type: "user.created", data: { id: "u1" } });
    const req = makeRequest(body);
    const opts: MosaicClerkWebhookHandlerOptions = { webhookSecret: "whsec_test" };
    const res = await MosaicClerkWebhookHandler(req, opts);
    expect(res.status).toBe(200);
  });

  it("returns 400 when svix headers are missing", async () => {
    const req = new Request("https://example.com/api/webhooks/clerk", {
      method: "POST",
      body: JSON.stringify({ type: "organization.created", data: {} }),
      headers: { "Content-Type": "application/json" },
      // svix-id missing intentionally
    });
    const opts: MosaicClerkWebhookHandlerOptions = { webhookSecret: "whsec_test" };
    const res = await MosaicClerkWebhookHandler(req, opts);
    expect(res.status).toBe(400);
  });

  it("returns 500 when handler throws", async () => {
    const body = JSON.stringify({
      type: "organization.created",
      data: { id: "org_err" },
    });
    const req = makeRequest(body);
    const opts: MosaicClerkWebhookHandlerOptions = {
      webhookSecret: "whsec_test",
      onOrganizationCreated: async () => {
        throw new Error("Convex write failed");
      },
    };
    const res = await MosaicClerkWebhookHandler(req, opts);
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain("Convex write failed");
  });

  it("does not call handler when callback is not provided", async () => {
    const body = JSON.stringify({
      type: "organization.created",
      data: { id: "org_1", name: "Acme", slug: "acme" },
    });
    const req = makeRequest(body);
    // No onOrganizationCreated callback
    const opts: MosaicClerkWebhookHandlerOptions = { webhookSecret: "whsec_test" };
    const res = await MosaicClerkWebhookHandler(req, opts);
    expect(res.status).toBe(200);
  });
});
