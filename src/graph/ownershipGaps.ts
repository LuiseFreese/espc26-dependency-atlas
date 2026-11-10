import type { Asset, Dependency } from "../types";
import { buildDependentsIndex, computeImpact } from "./impact";

export interface OwnershipGap {
  asset: Asset;
  directCount: number;
  indirectCount: number;
  /** Unique assets that would be affected if this unowned asset went down. */
  dependentCount: number;
}

/**
 * Assets without a business owner, ranked by how much of the landscape depends on them.
 * Reuses the impact traversal, so cycles and diamond paths are handled identically to the simulation.
 */
export function rankOwnershipGaps(assets: readonly Asset[], dependencies: readonly Dependency[]): OwnershipGap[] {
  const index = buildDependentsIndex(dependencies);
  return assets
    .filter((asset) => !asset.ownerId)
    .map((asset) => {
      const impact = computeImpact(asset.id, dependencies, index);
      return {
        asset,
        directCount: impact.direct.size,
        indirectCount: impact.indirect.size,
        dependentCount: impact.affected.size,
      };
    })
    .sort((a, b) => b.dependentCount - a.dependentCount || a.asset.name.localeCompare(b.asset.name));
}
