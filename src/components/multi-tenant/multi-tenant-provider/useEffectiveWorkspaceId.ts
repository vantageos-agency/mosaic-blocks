/**
 * useEffectiveWorkspaceId — alias of `useMosaicWorkspace`: reads the workspace
 * id the provider resolved.
 *
 * The hook reads from MosaicMultiTenantProvider's context. If used outside that
 * provider it returns `{ workspaceId: null, isLoading: false }`.
 *
 * It does NOT import from @vantageos/cloud-identity, and cloud-identity exports
 * no symbol of this name (its equivalent is called `getEffectiveTenantId`). The
 * provider's `resolveWorkspaceId` prop is the integration point.
 *
 * @example
 * const { workspaceId } = useEffectiveWorkspaceId();
 * // workspaceId: string | null
 */

export { useMosaicWorkspace as useEffectiveWorkspaceId } from "./MosaicMultiTenantProvider.js";
export type { MosaicWorkspaceContext } from "./MosaicMultiTenantProvider.js";
