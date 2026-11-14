import type { Item } from "../content/schema";
import { RpgIcon, type RpgIconName } from "./RpgIcon";

const itemArt: Partial<Record<string, RpgIconName>> = {
  "patch-kit": "patch-kit",
  "focus-cell": "focus-cell",
  "pulse-baton": "pulse-baton",
  "arc-projector": "arc-projector",
  "phase-driver": "phase-driver",
  "insulated-coat": "insulated-coat",
  "mesh-vest": "mesh-vest",
  "faraday-rig": "faraday-rig",
};

const fallbackArt: Record<Item["kind"], RpgIconName> = {
  weapon: "skills",
  armor: "brace",
  healing: "patch-kit",
  focus: "focus-cell",
};

export function SupplyIcon({ item, size = 24 }: { item: Item; size?: number }) {
  return <RpgIcon name={itemArt[item.id] ?? fallbackArt[item.kind]} size={size} />;
}
