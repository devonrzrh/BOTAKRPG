import type { Content, Item } from "../content/schema";
import { stats, type Save } from "./state";

export function supplyPool(save: Save, content: Content): Item[] {
  return content.entities.filter((entity): entity is Item => {
    if (entity.type !== "item") return false;
    const owned = save.supply.items[entity.id] ?? 0;
    return entity.kind === "weapon" || entity.kind === "armor"
      ? owned === 0
      : owned < Number.MAX_SAFE_INTEGER;
  });
}

export function drawSupply(
  save: Save,
  content: Content,
  random = Math.random,
): { save: Save; item: Item | undefined } {
  if (!save.supply.tokens) return { save, item: undefined };
  const pool = supplyPool(save, content);
  if (!pool.length) return { save, item: undefined };
  const roll = random();
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1)
    return { save, item: undefined };

  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let threshold = Math.floor(roll * total);
  // A value immediately below 1 can round up when multiplied by total.
  threshold = Math.min(threshold, total - 1);
  for (const item of pool) {
    threshold -= item.weight;
    if (threshold >= 0) continue;
    return {
      item,
      save: {
        ...save,
        supply: {
          ...save.supply,
          tokens: save.supply.tokens - 1,
          items: {
            ...save.supply.items,
            [item.id]: (save.supply.items[item.id] ?? 0) + 1,
          },
        },
      },
    };
  }
  return { save, item: undefined };
}

export function equipGear(save: Save, item: Item): Save {
  const slot = item.kind;
  if ((slot !== "weapon" && slot !== "armor") || !save.supply.items[item.id])
    return save;
  const equipped = save.supply.equipped;
  return {
    ...save,
    supply: {
      ...save.supply,
      equipped: {
        ...equipped,
        [slot]: equipped[slot] === item.id ? null : item.id,
      },
    },
  };
}

export function useConsumable(save: Save, item: Item): Save {
  const owned = save.supply.items[item.id] ?? 0;
  if (!owned || save.character.hp === 0) return save;
  const limits = stats(save);
  const value =
    item.kind === "healing"
      ? "hp"
      : item.kind === "focus"
        ? "focus"
        : undefined;
  if (!value) return save;
  const max = value === "hp" ? limits.maxHp : limits.maxFocus;
  const current = save.character[value];
  if (current >= max) return save;

  const items = { ...save.supply.items };
  if (owned === 1) delete items[item.id];
  else items[item.id] = owned - 1;
  return {
    ...save,
    character: {
      ...save.character,
      [value]: Math.min(max, current + item.amount),
    },
    supply: { ...save.supply, items },
  };
}
