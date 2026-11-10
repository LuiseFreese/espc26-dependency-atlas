import type { AssetType, ImpactState } from "../types";

export const TYPE_ICON: Record<AssetType, string> = {
  Application: "🖥",
  API: "⚙",
  Database: "🗄",
  "External Service": "☁",
};

export const IMPACT_LABEL: Record<ImpactState, { icon: string; text: string }> = {
  unavailable: { icon: "⛔", text: "Unavailable" },
  direct: { icon: "⚠", text: "Direct impact" },
  indirect: { icon: "◔", text: "Indirect impact" },
  unaffected: { icon: "·", text: "Unaffected" },
};
