import type { Asset, Dependency, ImpactState } from "../types";

export interface ImpactResult {
  /** The asset simulated as unavailable. Never counted as affected. */
  sourceId: string;
  /** Assets that directly require the source. */
  direct: Set<string>;
  /** Assets that require the source only through other assets. */
  indirect: Set<string>;
  /** direct ∪ indirect — unique, excludes the source. */
  affected: Set<string>;
  /** Dependency ids that lie on a path from an affected asset to the source. */
  pathEdgeIds: Set<string>;
}

/** Reverse adjacency: requiredId -> dependencies whose dependent needs it. */
export function buildDependentsIndex(dependencies: readonly Dependency[]): Map<string, Dependency[]> {
  const index = new Map<string, Dependency[]>();
  for (const dep of dependencies) {
    const list = index.get(dep.requiredId);
    if (list) list.push(dep);
    else index.set(dep.requiredId, [dep]);
  }
  // Sorted so traversal order (and therefore any derived ordering) is deterministic.
  for (const list of index.values()) list.sort((a, b) => a.dependentId.localeCompare(b.dependentId));
  return index;
}

/**
 * Breadth-first traversal against the dependency direction:
 * if A requires B, making B unavailable affects A.
 * A visited set guarantees cycles and diamond paths are handled without double counting.
 */
export function computeImpact(
  sourceId: string,
  dependencies: readonly Dependency[],
  index: Map<string, Dependency[]> = buildDependentsIndex(dependencies),
): ImpactResult {
  const direct = new Set<string>();
  const indirect = new Set<string>();
  const pathEdgeIds = new Set<string>();
  const visited = new Set<string>([sourceId]);

  let frontier = [sourceId];
  let depth = 0;
  while (frontier.length) {
    depth++;
    const next: string[] = [];
    for (const requiredId of frontier) {
      for (const dep of index.get(requiredId) ?? []) {
        if (dep.dependentId === requiredId) continue; // self-link, ignore defensively
        pathEdgeIds.add(dep.id);
        if (visited.has(dep.dependentId)) continue;
        visited.add(dep.dependentId);
        (depth === 1 ? direct : indirect).add(dep.dependentId);
        next.push(dep.dependentId);
      }
    }
    frontier = next;
  }

  const affected = new Set<string>([...direct, ...indirect]);
  return { sourceId, direct, indirect, affected, pathEdgeIds };
}

export function impactStateFor(assetId: string, impact: ImpactResult | null): ImpactState | null {
  if (!impact) return null;
  if (assetId === impact.sourceId) return "unavailable";
  if (impact.direct.has(assetId)) return "direct";
  if (impact.indirect.has(assetId)) return "indirect";
  return "unaffected";
}

export interface ImpactSummary {
  directCount: number;
  indirectCount: number;
  affectedCount: number;
  owners: { id: string; name: string; assetCount: number }[];
  unownedAffectedCount: number;
}

export function summarizeImpact(impact: ImpactResult, assetsById: Map<string, Asset>): ImpactSummary {
  const owners = new Map<string, { id: string; name: string; assetCount: number }>();
  let unownedAffectedCount = 0;
  for (const id of impact.affected) {
    const asset = assetsById.get(id);
    if (!asset) continue;
    if (!asset.ownerId) {
      unownedAffectedCount++;
      continue;
    }
    const entry = owners.get(asset.ownerId) ?? { id: asset.ownerId, name: asset.ownerName ?? "Unknown", assetCount: 0 };
    entry.assetCount++;
    owners.set(asset.ownerId, entry);
  }
  return {
    directCount: impact.direct.size,
    indirectCount: impact.indirect.size,
    affectedCount: impact.affected.size,
    owners: [...owners.values()].sort((a, b) => b.assetCount - a.assetCount || a.name.localeCompare(b.name)),
    unownedAffectedCount,
  };
}
