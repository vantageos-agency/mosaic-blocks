/**
 * MosaicClerkWebhookHandler — template handler for Clerk → Convex sync.
 *
 * Handles: organization.created, organizationMembership.created,
 * organizationMembership.deleted events and routes them through
 * the cloud-identity primitive to sync with Convex.
 *
 * Usage: import and call in your Next.js App Router API route:
 *
 * @example
 * // app/api/webhooks/clerk/route.ts
 * import { MosaicClerkWebhookHandler } from "@vantageos/mosaic-blocks"
 *
 * export async function POST(req: Request) {
 *   return MosaicClerkWebhookHandler(req, {
 *     webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
 *     onOrganizationCreated: async (org) => { ... },
 *     onMembershipCreated: async (data) => { ... },
 *     onMembershipDeleted: async (data) => { ... },
 *   })
 * }
 *
 * Note: svix is an optional peer dependency required only for webhook signature
 * verification. Install it in your app: `npm install svix`
 * If svix is absent at runtime, this handler throws an explicit Error with
 * installation instructions.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicClerkOrganization {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
  publicMetadata: Record<string, unknown>;
}

export interface MosaicClerkMembership {
  id: string;
  role: string;
  publicMetadata: Record<string, unknown>;
  organization: MosaicClerkOrganization;
  publicUserData: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
    identifier: string;
  };
}

export interface MosaicClerkWebhookHandlerOptions {
  /** Clerk webhook signing secret (CLERK_WEBHOOK_SECRET env var) */
  webhookSecret: string;
  /** Called when an organization is created in Clerk */
  onOrganizationCreated?: (org: MosaicClerkOrganization) => Promise<void> | void;
  /** Called when a member joins an organization */
  onMembershipCreated?: (data: MosaicClerkMembership) => Promise<void> | void;
  /** Called when a member leaves or is removed from an organization */
  onMembershipDeleted?: (data: MosaicClerkMembership) => Promise<void> | void;
}

// ── Svix header constants ─────────────────────────────────────────────────────

const SVIX_HEADERS = ["svix-id", "svix-timestamp", "svix-signature"] as const;

// ── Handler ───────────────────────────────────────────────────────────────────

/**
 * MosaicClerkWebhookHandler — verifies and dispatches Clerk webhook events.
 *
 * Returns a `Response` compatible with Next.js App Router route handlers.
 * svix is an optional peer dependency and must be installed in the consuming
 * app (`npm install svix`). Throws an explicit Error if svix is not installed.
 */
export async function MosaicClerkWebhookHandler(
  req: Request,
  options: MosaicClerkWebhookHandlerOptions,
): Promise<Response> {
  const { webhookSecret, onOrganizationCreated, onMembershipCreated, onMembershipDeleted } =
    options;

  // ── Verify signature via svix ─────────────────────────────────────────────
  // svix is an optional peer dependency. A literal dynamic import lets TypeScript
  // resolve types at build time (via devDependencies) while keeping it out of the
  // main bundle at runtime. Consumers must install svix themselves.
  let Webhook: typeof import("svix").Webhook;
  try {
    ({ Webhook } = await import("svix"));
  } catch {
    throw new Error(
      "MosaicClerkWebhookHandler requires the 'svix' package for webhook signature verification. Install it: npm install svix (or pnpm add svix).",
    );
  }

  const svixHeaders: Record<string, string> = {};
  for (const key of SVIX_HEADERS) {
    const val = req.headers.get(key);
    if (!val) {
      return new Response(`Missing required svix header: ${key}`, { status: 400 });
    }
    svixHeaders[key] = val;
  }

  const body = await req.text();

  let evt: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(webhookSecret);
    evt = wh.verify(body, svixHeaders) as typeof evt;
  } catch {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  // ── Route events ──────────────────────────────────────────────────────────
  try {
    switch (evt.type) {
      case "organization.created": {
        if (onOrganizationCreated) {
          await onOrganizationCreated(evt.data as unknown as MosaicClerkOrganization);
        }
        break;
      }
      case "organizationMembership.created": {
        if (onMembershipCreated) {
          await onMembershipCreated(evt.data as unknown as MosaicClerkMembership);
        }
        break;
      }
      case "organizationMembership.deleted": {
        if (onMembershipDeleted) {
          await onMembershipDeleted(evt.data as unknown as MosaicClerkMembership);
        }
        break;
      }
      default:
        // Unknown event type — ignore gracefully
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown handler error";
    return new Response(`Handler error: ${message}`, { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
