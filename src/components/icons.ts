import type { AssetType, ImpactState } from "../types";

export const TYPE_ICON: Record<AssetType, string> = {
  Application: "🖥",
  API: "⚙",
  Database: "🗄",
  "External Service": "☁",
};

export const IMPACT_LABEL: Record<ImpactState, { icon: string; text: string }> = {
  unavailable: { icon: "💥", text: "Down" },
  direct: { icon: "⚠", text: "Breaks immediately" },
  indirect: { icon: "◔", text: "Breaks because of that" },
  unaffected: { icon: "·", text: "Keeps running" },
};
