import { useMemo, useState, type FormEvent } from "react";
import type { Asset, Dependency, Owner } from "../types";
import type { ImpactResult, ImpactSummary } from "../graph/impact";
import { IMPACT_LABEL, TYPE_ICON } from "./icons";

export interface SidePanelProps {
  asset: Asset;
  assets: Asset[];
  assetsById: Map<string, Asset>;
  dependencies: Dependency[];
  owners: Owner[];
  impact: ImpactResult | null;
  summary: ImpactSummary | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onSimulate: (id: string) => void;
  onResetSimulation: () => void;
  onSetOwner: (assetId: string, ownerId: string | null) => Promise<void>;
  onAddDependency: (dependentId: string, requiredId: string) => Promise<Dependency>;
}

type Feedback = { kind: "error" | "success"; text: string } | null;

export function SidePanel(props: SidePanelProps) {
  const { asset, assets, assetsById, dependencies, owners, impact, summary, onClose, onSelect, onSimulate, onResetSimulation, onSetOwner, onAddDependency } = props;

  const requires = useMemo(
    () => dependencies.filter((d) => d.dependentId === asset.id).map((d) => assetsById.get(d.requiredId)).filter((a): a is Asset => !!a).sort((a, b) => a.name.localeCompare(b.name)),
    [dependencies, asset.id, assetsById],
  );
  const requiredBy = useMemo(
    () => dependencies.filter((d) => d.requiredId === asset.id).map((d) => assetsById.get(d.dependentId)).filter((a): a is Asset => !!a).sort((a, b) => a.name.localeCompare(b.name)),
    [dependencies, asset.id, assetsById],
  );

  const isSimulatedSource = impact?.sourceId === asset.id;

  // --- Owner editing -------------------------------------------------------
  const [editingOwner, setEditingOwner] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState(asset.ownerId ?? "");
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [ownerFeedback, setOwnerFeedback] = useState<Feedback>(null);

  async function saveOwner(e: FormEvent) {
    e.preventDefault();
    setOwnerBusy(true);
    setOwnerFeedback(null);
    try {
      await onSetOwner(asset.id, ownerDraft || null);
      setOwnerFeedback({ kind: "success", text: ownerDraft ? "Business owner saved to Dataverse." : "Business owner cleared." });
      setEditingOwner(false);
    } catch (err) {
      setOwnerFeedback({ kind: "error", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setOwnerBusy(false);
    }
  }

  // --- New dependency --------------------------------------------------------
  const [direction, setDirection] = useState<"requires" | "requiredBy">("requires");
  const [otherId, setOtherId] = useState("");
  const [depBusy, setDepBusy] = useState(false);
  const [depFeedback, setDepFeedback] = useState<Feedback>(null);

  const otherOptions = useMemo(() => assets.filter((a) => a.id !== asset.id).sort((a, b) => a.name.localeCompare(b.name)), [assets, asset.id]);

  async function saveDependency(e: FormEvent) {
    e.preventDefault();
    setDepBusy(true);
    setDepFeedback(null);
    try {
      const dependentId = direction === "requires" ? asset.id : otherId;
      const requiredId = direction === "requires" ? otherId : asset.id;
      const created = await onAddDependency(dependentId, requiredId);
      setDepFeedback({ kind: "success", text: `Saved: ${created.name}` });
      setOtherId("");
    } catch (err) {
      setDepFeedback({ kind: "error", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setDepBusy(false);
    }
  }

  return (
    <aside className="panel" aria-label="Selected asset">
      <div className="panel-header">
        <div>
          <h2>{asset.name}</h2>
          <div className="sub">
            <span>
              {TYPE_ICON[asset.type]} {asset.type}
            </span>
            <span className={`badge crit-${asset.criticality}`}>{asset.criticality} criticality</span>
          </div>
        </div>
        <button className="ghost close" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>

      {asset.description && <p className="description">{asset.description}</p>}

      <section className={`section ${impact ? "impact" : ""}`}>
        <h3>Blast radius</h3>
        {isSimulatedSource && summary ? (
          <>
            <p className="empty-hint">
              If <strong>{asset.name}</strong> goes down, this is what stops working. Nothing is actually touched — it's a what-if.
            </p>
            <div className="stats">
              <div className="stat direct">
                <div className="value">{summary.directCount}</div>
                <div className="label">
                  <span aria-hidden="true">{IMPACT_LABEL.direct.icon}</span> break immediately
                </div>
              </div>
              <div className="stat indirect">
                <div className="value">{summary.indirectCount}</div>
                <div className="label">
                  <span aria-hidden="true">{IMPACT_LABEL.indirect.icon}</span> break because of that
                </div>
              </div>
              <div className="stat total">
                <div className="value">{summary.affectedCount}</div>
                <div className="label">systems affected</div>
              </div>
            </div>
            <h3>People to call</h3>
            {summary.owners.length === 0 && summary.unownedAffectedCount === 0 ? (
              <p className="empty-hint">Nothing depends on this asset.</p>
            ) : (
              <ul className="list">
                {summary.owners.map((o) => (
                  <li key={o.id}>
                    <span aria-hidden="true">👤</span>
                    {o.name}
                    <span className="meta">
                      {o.assetCount} asset{o.assetCount === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
                {summary.unownedAffectedCount > 0 && (
                  <li style={{ color: "var(--crit-medium)" }}>
                    <span aria-hidden="true">⚠</span>
                    Nobody — no business owner
                    <span className="meta">
                      {summary.unownedAffectedCount} asset{summary.unownedAffectedCount === 1 ? "" : "s"}
                    </span>
                  </li>
                )}
              </ul>
            )}
            <div className="actions">
              <button onClick={onResetSimulation}>↺ Clear</button>
            </div>
          </>
        ) : (
          <>
            <p className="empty-hint">
              {impact
                ? `${assetsById.get(impact.sourceId)?.name ?? "Another system"} is down in this what-if. ${asset.name} ${
                    impact.direct.has(asset.id)
                      ? "breaks immediately."
                      : impact.indirect.has(asset.id)
                        ? "breaks because something it needs breaks."
                        : "keeps running."
                  }`
                : "Pretend this system just went down and see everything that stops working because of it. Nothing is actually touched."}
            </p>
            <div className="actions">
              <button className="primary" onClick={() => onSimulate(asset.id)}>
                💥 Show blast radius
              </button>
              {impact && <button onClick={onResetSimulation}>↺ Clear</button>}
            </div>
          </>
        )}
      </section>

      <section className="section">
        <h3>Business owner</h3>
        {!editingOwner ? (
          <>
            <ul className="list">
              <li>
                <span aria-hidden="true">{asset.ownerName ? "👤" : "⚠"}</span>
                <span style={{ color: asset.ownerName ? undefined : "var(--crit-medium)" }}>{asset.ownerName ?? "No business owner assigned"}</span>
              </li>
            </ul>
            <div className="actions">
              <button
                onClick={() => {
                  setOwnerDraft(asset.ownerId ?? "");
                  setOwnerFeedback(null);
                  setEditingOwner(true);
                }}
              >
                ✎ Change owner
              </button>
            </div>
          </>
        ) : (
          <form className="inline-form" onSubmit={saveOwner}>
            <div className="field">
              <label htmlFor="owner-select">Accountable person</label>
              <select id="owner-select" value={ownerDraft} onChange={(e) => setOwnerDraft(e.target.value)} disabled={ownerBusy}>
                <option value="">— No business owner —</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                    {o.email ? ` (${o.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="actions">
              <button type="submit" className="primary" disabled={ownerBusy || ownerDraft === (asset.ownerId ?? "")}>
                {ownerBusy ? "Saving…" : "Save owner"}
              </button>
              <button type="button" className="ghost" onClick={() => setEditingOwner(false)} disabled={ownerBusy}>
                Cancel
              </button>
            </div>
          </form>
        )}
        {ownerFeedback && <div className={`message ${ownerFeedback.kind}`}>{ownerFeedback.text}</div>}
      </section>

      <section className="section">
        <h3>Requires ({requires.length})</h3>
        {requires.length ? (
          <ul className="list">
            {requires.map((a) => (
              <li key={a.id}>
                <span aria-hidden="true">{TYPE_ICON[a.type]}</span>
                <button className="link" onClick={() => onSelect(a.id)}>
                  {a.name}
                </button>
                <span className="meta">{a.ownerName ?? "No owner"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-hint">Doesn't require anything.</p>
        )}
      </section>

      <section className="section">
        <h3>Required by ({requiredBy.length})</h3>
        {requiredBy.length ? (
          <ul className="list">
            {requiredBy.map((a) => (
              <li key={a.id}>
                <span aria-hidden="true">{TYPE_ICON[a.type]}</span>
                <button className="link" onClick={() => onSelect(a.id)}>
                  {a.name}
                </button>
                <span className="meta">{a.ownerName ?? "No owner"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-hint">Nothing depends on this asset.</p>
        )}
      </section>

      <section className="section">
        <h3>Add dependency</h3>
        <form className="inline-form" onSubmit={saveDependency}>
          <div className="field">
            <label htmlFor="dep-direction">Direction</label>
            <select id="dep-direction" value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)} disabled={depBusy}>
              <option value="requires">{asset.name} requires …</option>
              <option value="requiredBy">… requires {asset.name}</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="dep-other">Other asset</label>
            <select id="dep-other" value={otherId} onChange={(e) => setOtherId(e.target.value)} disabled={depBusy} required>
              <option value="">Select an asset…</option>
              {otherOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>
          <div className="actions">
            <button type="submit" className="primary" disabled={depBusy || !otherId}>
              {depBusy ? "Saving…" : "Save dependency"}
            </button>
          </div>
          {depFeedback && <div className={`message ${depFeedback.kind}`}>{depFeedback.text}</div>}
        </form>
      </section>
    </aside>
  );
}
