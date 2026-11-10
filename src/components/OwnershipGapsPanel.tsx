import type { OwnershipGap } from "../graph/ownershipGaps";
import { TYPE_ICON } from "./icons";

export function OwnershipGapsPanel({ gaps, onPick, onClose }: { gaps: OwnershipGap[]; onPick: (assetId: string) => void; onClose: () => void }) {
  return (
    <section className="gaps-panel" aria-label="Ownership gaps">
      <header>
        <h3>⚠ Ownership gaps</h3>
        <span className="sub">
          {gaps.length} asset{gaps.length === 1 ? "" : "s"} without a business owner, ranked by blast radius
        </span>
        <button className="ghost close" onClick={onClose} aria-label="Close ownership gaps">
          ✕
        </button>
      </header>
      {gaps.length === 0 ? (
        <p className="empty-hint">Every asset has a business owner. 🎉</p>
      ) : (
        <ol className="gaps-list">
          {gaps.map((gap, i) => (
            <li key={gap.asset.id}>
              <button onClick={() => onPick(gap.asset.id)}>
                <span className="rank">{i + 1}</span>
                <span className="icon" aria-hidden="true">
                  {TYPE_ICON[gap.asset.type]}
                </span>
                <span className="label">
                  <span className="name">{gap.asset.name}</span>
                  <span className="meta">
                    {gap.asset.type} · {gap.directCount} direct · {gap.indirectCount} indirect
                  </span>
                </span>
                <span className={`count ${gap.dependentCount === 0 ? "zero" : ""}`}>
                  {gap.dependentCount}
                  <small>dependents</small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
