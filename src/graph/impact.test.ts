import { describe, expect, it } from "vitest";
import { computeImpact, summarizeImpact } from "./impact";
import type { Asset, Dependency } from "../types";

const dep = (dependentId: string, requiredId: string): Dependency => ({
  id: `${dependentId}->${requiredId}`,
  name: `${dependentId} → ${requiredId}`,
  dependentId,
  requiredId,
});

describe("computeImpact", () => {
  it("follows the dependency direction: if A requires B, simulating B affects A (not the reverse)", () => {
    const deps = [dep("A", "B")];
    const b = computeImpact("B", deps);
    expect([...b.direct]).toEqual(["A"]);
    expect(b.affected.size).toBe(1);

    const a = computeImpact("A", deps);
    expect(a.affected.size).toBe(0);
  });

  it("separates direct from indirect dependents", () => {
    // portal requires api, api requires db
    const deps = [dep("portal", "api"), dep("api", "db")];
    const r = computeImpact("db", deps);
    expect([...r.direct]).toEqual(["api"]);
    expect([...r.indirect]).toEqual(["portal"]);
    expect(r.affected.size).toBe(2);
  });

  it("leaves independent nodes unaffected", () => {
    const deps = [dep("portal", "api"), dep("hr-portal", "hr-db")];
    const r = computeImpact("api", deps);
    expect(r.affected.has("hr-portal")).toBe(false);
    expect(r.affected.has("hr-db")).toBe(false);
    expect(r.affected.size).toBe(1);
  });

  it("terminates on cycles and never counts the source", () => {
    // crm <-> sync, sync requires db
    const deps = [dep("crm", "sync"), dep("sync", "crm"), dep("sync", "db")];
    const r = computeImpact("db", deps);
    expect([...r.direct]).toEqual(["sync"]);
    expect([...r.indirect]).toEqual(["crm"]);
    expect(r.affected.size).toBe(2);

    const fromCrm = computeImpact("crm", deps);
    expect(fromCrm.affected.has("crm")).toBe(false);
    expect([...fromCrm.direct]).toEqual(["sync"]);
    expect(fromCrm.affected.size).toBe(1);
  });

  it("counts diamond paths once", () => {
    // portal requires checkout and orders; both require identity; checkout also requires orders
    const deps = [
      dep("portal", "checkout"),
      dep("portal", "orders"),
      dep("checkout", "identity"),
      dep("orders", "identity"),
      dep("checkout", "orders"),
    ];
    const r = computeImpact("identity", deps);
    expect([...r.direct].sort()).toEqual(["checkout", "orders"]);
    expect([...r.indirect]).toEqual(["portal"]);
    expect(r.affected.size).toBe(3);
    expect(r.pathEdgeIds.size).toBe(5);
  });

  it("excludes the selected asset from the affected count even when it is reachable via a cycle", () => {
    const deps = [dep("a", "b"), dep("b", "a")];
    const r = computeImpact("a", deps);
    expect(r.affected.has("a")).toBe(false);
    expect(r.affected.size).toBe(1);
  });

  it("marks only edges that lead back to the source as impact paths", () => {
    const deps = [dep("portal", "api"), dep("api", "db"), dep("portal", "search")];
    const r = computeImpact("db", deps);
    expect(r.pathEdgeIds.has("portal->api")).toBe(true);
    expect(r.pathEdgeIds.has("api->db")).toBe(true);
    expect(r.pathEdgeIds.has("portal->search")).toBe(false);
  });

  it("is deterministic regardless of input order", () => {
    const deps = [dep("x", "s"), dep("y", "s"), dep("z", "x"), dep("z", "y")];
    const a = computeImpact("s", deps);
    const b = computeImpact("s", [...deps].reverse());
    expect([...a.direct].sort()).toEqual([...b.direct].sort());
    expect([...a.indirect].sort()).toEqual([...b.indirect].sort());
    expect(a.affected.size).toBe(b.affected.size);
  });
});

describe("summarizeImpact", () => {
  const asset = (id: string, ownerId?: string): Asset => ({
    id,
    name: id,
    type: "API",
    criticality: "High",
    ownerId,
    ownerName: ownerId ? `Owner ${ownerId}` : undefined,
  });

  it("aggregates owners of affected assets and counts unowned ones", () => {
    const deps = [dep("p1", "svc"), dep("p2", "svc"), dep("p3", "p1")];
    const assets = new Map([
      ["svc", asset("svc", "o-svc")],
      ["p1", asset("p1", "o1")],
      ["p2", asset("p2", "o1")],
      ["p3", asset("p3")],
    ]);
    const s = summarizeImpact(computeImpact("svc", deps), assets);
    expect(s.directCount).toBe(2);
    expect(s.indirectCount).toBe(1);
    expect(s.affectedCount).toBe(3);
    expect(s.owners).toEqual([{ id: "o1", name: "Owner o1", assetCount: 2 }]);
    expect(s.unownedAffectedCount).toBe(1);
  });
});
