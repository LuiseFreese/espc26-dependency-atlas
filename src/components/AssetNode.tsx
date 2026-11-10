import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { Asset, ImpactState } from "../types";
import { IMPACT_LABEL, TYPE_ICON } from "./icons";

export interface AssetNodeData extends Record<string, unknown> {
  asset: Asset;
  impact: ImpactState | null;
  isSearchHit: boolean;
}

export type AssetFlowNode = Node<AssetNodeData, "asset">;

function AssetNodeComponent({ data, selected }: NodeProps<AssetFlowNode>) {
  const { asset, impact, isSearchHit } = data;
  const classes = ["asset-node", impact ?? "", selected ? "selected" : "", isSearchHit ? "search-hit" : ""]
    .filter(Boolean)
    .join(" ");
  const impactLabel = impact && impact !== "unaffected" ? IMPACT_LABEL[impact] : null;

  return (
    <div className={classes} role="group" aria-label={`${asset.type} ${asset.name}`}>
      <Handle type="target" position={Position.Top} />
      <div className="row">
        <span className="type">
          <span className="type-icon" aria-hidden="true">
            {TYPE_ICON[asset.type]}
          </span>
          {asset.type}
        </span>
        {impactLabel && (
          <span className={`badge impact ${impact}`}>
            <span aria-hidden="true">{impactLabel.icon}</span>
            {impactLabel.text}
          </span>
        )}
      </div>
      <div className="name">{asset.name}</div>
      <div className="row">
        <span className={`badge crit-${asset.criticality}`}>{asset.criticality} criticality</span>
      </div>
      <div className={`owner ${asset.ownerName ? "" : "none"}`}>
        <span aria-hidden="true">{asset.ownerName ? "👤" : "⚠"}</span>
        {asset.ownerName ?? "No business owner"}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const AssetNode = memo(AssetNodeComponent);
