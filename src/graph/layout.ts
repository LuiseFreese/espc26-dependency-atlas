import dagre from "@dagrejs/dagre";
import type { Asset, Dependency } from "../types";

export const NODE_WIDTH = 260;
export const NODE_HEIGHT = 118;

export type Positions = Map<string, { x: number; y: number }>;

/**
 * Computes a layered layout once for a given set of assets/dependencies.
 * Dependents sit above the assets they require, so "what breaks" flows upwards.
 * Dagre tolerates cycles by internally reversing one edge of each cycle.
 */
export function layoutGraph(assets: readonly Asset[], dependencies: readonly Dependency[]): Positions {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 110, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  const ids = new Set(assets.map((a) => a.id));
  for (const asset of assets) g.setNode(asset.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const dep of dependencies) {
    if (dep.dependentId === dep.requiredId) continue;
    if (!ids.has(dep.dependentId) || !ids.has(dep.requiredId)) continue;
    g.setEdge(dep.dependentId, dep.requiredId);
  }

  dagre.layout(g);

  const positions: Positions = new Map();
  for (const asset of assets) {
    const n = g.node(asset.id);
    // dagre returns centre coordinates; React Flow expects the top-left corner.
    positions.set(asset.id, { x: n.x - NODE_WIDTH / 2, y: n.y - NODE_HEIGHT / 2 });
  }
  return positions;
}
