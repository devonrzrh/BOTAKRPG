import {
  BatteryCharging,
  BriefcaseMedical,
  Cable,
  CircuitBoard,
  Shield,
  Shirt,
  Swords,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Item } from "../content/schema";

const itemIcons: Partial<Record<string, LucideIcon>> = {
  "pulse-baton": WandSparkles,
  "arc-projector": Cable,
  "phase-driver": CircuitBoard,
  "insulated-coat": Shirt,
  "mesh-vest": Shield,
  "faraday-rig": Zap,
};

const kindIcons: Record<Item["kind"], LucideIcon> = {
  weapon: Swords,
  armor: Shield,
  healing: BriefcaseMedical,
  focus: BatteryCharging,
};

export function SupplyIcon({ item, size = 20 }: { item: Item; size?: number }) {
  const Icon = itemIcons[item.id] ?? kindIcons[item.kind];
  return <Icon size={size} aria-hidden="true" />;
}
