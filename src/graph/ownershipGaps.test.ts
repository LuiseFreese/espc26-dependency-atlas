import { describe, expect, it } from "vitest";
import { rankOwnershipGaps } from "./ownershipGaps";
import type { Asset, Dependency } from "../types";

const asset = (id: string, ownerId?: string): Asset => ({ id, name: id, type: "API", criticality: "Medium", ownerId });
const dep = (dependentId: string, requiredId: string): Dependency => ({ id: `${dependentId}->${requiredId}`, name: "", dependentId, requiredId });

describe("rankOwnershipGaps", () => {
  it("lists only unowned assets, ranked by unique direct + indirect dependents", () => {
    const assets = [asset("db"), asset("api"), asset("portal", "o1"), asset("wiki"), asset("cache", "o2")];
    const deps = [dep("api", "db"), dep("portal", "api"), dep("portal", "db"), dep("api", "cache")];
    const gaps = rankOwnershipGaps(assets, deps);
    expect(gaps.map((g) => [g.asset.id, g.directCount, g.indirectCount, g.dependentCount])).toEqual([
      ["db", 2, 0, 2], // api + portal (portal reached twice, counted once)
      ["api", 1, 0, 1],
      ["wiki", 0, 0, 0],
    ]);
  });

  it("does not count the asset itself when it sits in a cycle", () => {
    const assets = [asset("a"), asset("b")];
    const gaps = rankOwnershipGaps(assets, [dep("a", "b"), dep("b", "a")]);
    expect(gaps.every((g) => g.dependentCount === 1)).toBe(true);
  });
});
