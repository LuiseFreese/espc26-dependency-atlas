import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Asset, Dependency, Owner } from "../types";
import { createDependency, loadAssets, loadDependencies, loadOwners, updateAssetOwner } from "./atlasRepository";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export interface AtlasData {
  status: LoadStatus;
  error: string | null;
  assets: Asset[];
  dependencies: Dependency[];
  owners: Owner[];
  assetsById: Map<string, Asset>;
  reload: () => Promise<void>;
  setOwner: (assetId: string, ownerId: string | null) => Promise<void>;
  addDependency: (dependentId: string, requiredId: string) => Promise<Dependency>;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateNewDependency(
  dependentId: string,
  requiredId: string,
  assetsById: Map<string, Asset>,
  dependencies: readonly Dependency[],
): void {
  if (!dependentId || !requiredId) throw new ValidationError("Pick both assets.");
  if (dependentId === requiredId) throw new ValidationError("An asset cannot depend on itself.");
  if (!assetsById.has(dependentId) || !assetsById.has(requiredId)) throw new ValidationError("Unknown asset.");
  if (dependencies.some((d) => d.dependentId === dependentId && d.requiredId === requiredId)) {
    throw new ValidationError(
      `${assetsById.get(dependentId)?.name} already requires ${assetsById.get(requiredId)?.name}.`,
    );
  }
}

export function useAtlasData(): AtlasData {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loadNonce, setLoadNonce] = useState(0);
  const ownersRef = useRef<Map<string, Owner>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ownerList = await loadOwners();
      const ownerMap = new Map(ownerList.map((o) => [o.id, o]));
      const [assetList, dependencyList] = await Promise.all([loadAssets(ownerMap), loadDependencies()]);
      return { ownerList, ownerMap, assetList, dependencyList };
    })().then(
      (result) => {
        if (cancelled) return;
        ownersRef.current = result.ownerMap;
        setOwners(result.ownerList);
        setAssets(result.assetList);
        setDependencies(result.dependencyList);
        setStatus("ready");
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loadNonce]);

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setLoadNonce((n) => n + 1);
  }, []);

  const assetsById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const setOwner = useCallback(async (assetId: string, ownerId: string | null) => {
    await updateAssetOwner(assetId, ownerId);
    const owner = ownerId ? ownersRef.current.get(ownerId) : undefined;
    // Only reflect the change after Dataverse confirmed the save.
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, ownerId: ownerId ?? undefined, ownerName: owner?.name } : a)),
    );
  }, []);

  const addDependency = useCallback(
    async (dependentId: string, requiredId: string) => {
      validateNewDependency(dependentId, requiredId, assetsById, dependencies);
      const created = await createDependency({
        dependent: assetsById.get(dependentId)!,
        required: assetsById.get(requiredId)!,
      });
      setDependencies((prev) => [...prev, created]);
      return created;
    },
    [assetsById, dependencies],
  );

  return { status, error, assets, dependencies, owners, assetsById, reload, setOwner, addDependency };
}
