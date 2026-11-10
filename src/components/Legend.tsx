import { IMPACT_LABEL, TYPE_ICON } from "./icons";
import type { AssetType } from "../types";

const TYPES: AssetType[] = ["Application", "API", "Database", "External Service"];

export function Legend({ simulating }: { simulating: boolean }) {
  return (
    <aside className="legend" aria-label="Legend">
      <span className="types" style={{ display: "contents" }}>
        <h3>Types</h3>
        {TYPES.map((t) => (
          <div className="legend-item" key={t}>
            <span aria-hidden="true">{TYPE_ICON[t]}</span>
            {t}
          </div>
        ))}
        <span className="divider" aria-hidden="true" />
      </span>
      {simulating ? (
        <>
          <h3>Impact</h3>
          <div className="legend-item">
            <span className="legend-swatch unavailable" /> {IMPACT_LABEL.unavailable.icon} {IMPACT_LABEL.unavailable.text}
          </div>
          <div className="legend-item">
            <span className="legend-swatch direct" /> {IMPACT_LABEL.direct.icon} {IMPACT_LABEL.direct.text}
          </div>
          <div className="legend-item">
            <span className="legend-swatch indirect" /> {IMPACT_LABEL.indirect.icon} {IMPACT_LABEL.indirect.text}
          </div>
          <div className="legend-item">
            <span className="legend-swatch unaffected" /> Unaffected (dimmed)
          </div>
        </>
      ) : (
        <>
          <h3>Reading</h3>
          <div className="legend-item">
            <span className="legend-edge" /> A → B means "A requires B"
          </div>
          <div className="legend-item">
            <span aria-hidden="true">⚠</span> No business owner
          </div>
        </>
      )}
    </aside>
  );
}
