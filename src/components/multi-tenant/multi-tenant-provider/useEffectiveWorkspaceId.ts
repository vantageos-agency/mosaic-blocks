/**
 * useEffectiveWorkspaceId — re-exposes the cloud-identity workspace resolution
 * helper as a typed React hook.
 *
 * The hook reads from MosaicMultiTenantProvider's context. If used outside that
 * provider it returns `{ workspaceId: null, isLoading: false }`.
 *
 * This is a thin, typed re-export of the cloud-identity primitive. It does NOT
 * import from @vantageos/cloud-identity directly — the provider's resolver prop
 * is the integration point.
 *
 * @example
 * const { workspaceId } = useEffectiveWorkspaceId();
 * // workspaceId: string | null
 */

export { useMosaicWorkspace as useEffectiveWorkspaceId } from "./MosaicMultiTenantProvider.js";
export type { MosaicWorkspaceContext } from "./MosaicMultiTenantProvider.js";
