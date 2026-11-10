import { useCallback, useMemo, useState } from "react";
import { AtlasGraph } from "./components/AtlasGraph";
import { Legend } from "./components/Legend";
import { SidePanel } from "./components/SidePanel";
import { Toolbar } from "./components/Toolbar";
import { EmptyState, ErrorState, LoadingState } from "./components/StateViews";
import { useAtlasData } from "./data/useAtlasData";
import { buildDependentsIndex, computeImpact, summarizeImpact } from "./graph/impact";
import { layoutGraph, type Positions } from "./graph/layout";
import type { Asset } from "./types";

export default function App() {
  const data = useAtlasData();
  const { assets, dependencies, assetsById } = data;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simulatedId, setSimulatedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [focusRequest, setFocusRequest] = useState<{ id: string; nonce: number } | null>(null);
  const [fitRequest, setFitRequest] = useState(0);

  // Layout is only recomputed when the set of assets changes. Selecting, simulating and adding
  // edges keep every node where it is, so the picture stays stable during the demo.
  const assetKey = useMemo(() => assets.map((a) => a.id).sort().join("|"), [assets]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on the asset set only
  const basePositions = useMemo(() => layoutGraph(assets, dependencies), [assetKey]);

  // Manual drags are stored separately and only apply to the layout they were made on.
  const [overrides, setOverrides] = useState<{ key: string; map: Positions }>({ key: "", map: new Map() });
  const positions = useMemo<Positions>(() => {
    if (overrides.key !== assetKey || overrides.map.size === 0) return basePositions;
    const merged = new Map(basePositions);
    for (const [id, pos] of overrides.map) if (merged.has(id)) merged.set(id, pos);
    return merged;
  }, [basePositions, overrides, assetKey]);

  const dependentsIndex = useMemo(() => buildDependentsIndex(dependencies), [dependencies]);
  const impact = useMemo(
    () => (simulatedId && assetsById.has(simulatedId) ? computeImpact(simulatedId, dependencies, dependentsIndex) : null),
    [simulatedId, dependencies, dependentsIndex, assetsById],
  );
  const summary = useMemo(() => (impact ? summarizeImpact(impact, assetsById) : null), [impact, assetsById]);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return new Set<string>();
    return new Set(assets.filter((a) => a.name.toLowerCase().includes(q)).map((a) => a.id));
  }, [assets, query]);

  const selectedAsset = selectedId ? (assetsById.get(selectedId) ?? null) : null;

  const handleNodeMoved = useCallback(
    (id: string, position: { x: number; y: number }) => {
      setOverrides((prev) => {
        const map = prev.key === assetKey ? new Map(prev.map) : new Map<string, { x: number; y: number }>();
        map.set(id, position);
        return { key: assetKey, map };
      });
    },
    [assetKey],
  );

  const focusAsset = useCallback((asset: Asset) => {
    setSelectedId(asset.id);
    setFocusRequest({ id: asset.id, nonce: Date.now() });
  }, []);

  if (data.status === "loading" || data.status === "idle") return <LoadingState />;
  if (data.status === "error") return <ErrorState message={data.error ?? "Unknown error"} onRetry={() => void data.reload()} />;
  if (!assets.length) return <EmptyState onRetry={() => void data.reload()} />;

  return (
    <div className={`app ${selectedAsset ? "" : "no-panel"}`}>
      <main className="canvas">
        <Toolbar
          assets={assets}
          assetCount={assets.length}
          dependencyCount={dependencies.length}
          query={query}
          onQueryChange={setQuery}
          onPick={focusAsset}
          onFit={() => setFitRequest((n) => n + 1)}
          onReload={() => void data.reload()}
          reloading={false}
          simulating={impact !== null}
          onResetSimulation={() => setSimulatedId(null)}
        />
        <AtlasGraph
          assets={assets}
          dependencies={dependencies}
          positions={positions}
          onNodeMoved={handleNodeMoved}
          selectedId={selectedId}
          onSelect={setSelectedId}
          impact={impact}
          searchHits={searchHits}
          focusRequest={focusRequest}
          fitRequest={fitRequest}
        />
        <Legend simulating={impact !== null} />
      </main>
      {selectedAsset && (
        <SidePanel
          key={selectedAsset.id}
          asset={selectedAsset}
          assets={assets}
          assetsById={assetsById}
          dependencies={dependencies}
          owners={data.owners}
          impact={impact}
          summary={summary}
          onClose={() => setSelectedId(null)}
          onSelect={(id) => {
            const a = assetsById.get(id);
            if (a) focusAsset(a);
          }}
          onSimulate={setSimulatedId}
          onResetSimulation={() => setSimulatedId(null)}
          onSetOwner={data.setOwner}
          onAddDependency={data.addDependency}
        />
      )}
    </div>
  );
}
