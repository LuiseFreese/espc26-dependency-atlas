import { useMemo, useState } from "react";
import type { Asset } from "../types";
import { TYPE_ICON } from "./icons";

export interface ToolbarProps {
  assets: Asset[];
  assetCount: number;
  dependencyCount: number;
  query: string;
  onQueryChange: (q: string) => void;
  onPick: (asset: Asset) => void;
  onFit: () => void;
  onReload: () => void;
  simulating: boolean;
  onResetSimulation: () => void;
  reloading: boolean;
}

export function Toolbar(props: ToolbarProps) {
  const { assets, assetCount, dependencyCount, query, onQueryChange, onPick, onFit, onReload, simulating, onResetSimulation, reloading } = props;
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return assets.filter((a) => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.ownerName?.toLowerCase().includes(q)).slice(0, 8);
  }, [assets, query]);

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <h1>Dependency Atlas</h1>
        <span className="count">
          {assetCount} assets · {dependencyCount} dependencies
        </span>
      </div>

      <div className="search">
        <span className="icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="search"
          placeholder="Search assets, types or owners…"
          aria-label="Search assets"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              onPick(results[0]);
              setOpen(false);
            }
            if (e.key === "Escape") {
              onQueryChange("");
              setOpen(false);
            }
          }}
        />
        {open && results.length > 0 && (
          <div className="search-results" role="listbox">
            {results.map((a) => (
              <button
                key={a.id}
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(a);
                  setOpen(false);
                }}
              >
                <span aria-hidden="true">{TYPE_ICON[a.type]}</span>
                {a.name}
                <span className="meta">{a.ownerName ?? "No owner"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-actions">
        {simulating && (
          <button className="danger" onClick={onResetSimulation}>
            ↺ Reset simulation
          </button>
        )}
        <button onClick={onFit} title="Fit graph to view">
          ⤢ Fit to view
        </button>
        <button onClick={onReload} disabled={reloading} title="Reload from Dataverse">
          {reloading ? "Loading…" : "⟳ Reload"}
        </button>
      </div>
    </header>
  );
}
