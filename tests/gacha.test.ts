import { describe, expect, it } from "vitest";
import { validateContent, type Item } from "../src/content/schema";
import raw from "../src/generated/content.json";
import { createBattle, itemTurn } from "../src/game/combat";
import {
  drawSupply,
  equipGear,
  supplyPool,
  useConsumable,
} from "../src/game/gacha";
import {
  completeActivity,
  initialSave,
  parseSave,
  stats,
} from "../src/game/state";

const content = validateContent(raw);
function item(id: string): Item {
  const entity = content.entities.find((entry) => entry.id === id);
  if (entity?.type !== "item") throw new Error(`Missing item: ${id}`);
  return entity;
}

it("uses a consumable before the enemy responds and spends exactly one turn", () => {
  const save = initialSave();
  const battle = createBattle();
  save.character.hp = 30;
  save.supply.items["patch-kit"] = 1;
  const patch = item("patch-kit");

  const result = itemTurn(battle, save, content, patch)!;
  expect(result.used.character.hp).toBe(48);
  expect(result.save.character.hp).toBe(40);
  expect(result.save.supply.items[patch.id]).toBeUndefined();
  expect(result.battle.turn).toBe(battle.turn + 1);
  expect(itemTurn(result.battle, result.save, content, patch)).toBeNull();
  expect(itemTurn({ ...battle, phase: "question" }, save, content, patch)).toBeNull();
  expect(save.supply.items[patch.id]).toBe(1);
});

describe("field supply draws", () => {
  it("spends one token and adds the weighted reward without mutating the journal", () => {
    const save = initialSave();
    const original = structuredClone(save);
    const pool = supplyPool(save, content);
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let start = 0;
    for (const reward of pool) {
      const result = drawSupply(save, content, () => (start + 0.5) / total);
      expect(result.item).toBe(reward);
      expect(result.save.supply.tokens).toBe(2);
      expect(result.save.supply.items).toEqual({ [reward.id]: 1 });
      expect(parseSave(result.save, content)).toEqual(result.save);
      start += reward.weight;
    }
    expect(save).toEqual(original);
  });

  it("excludes owned gear, stacks consumables, and leaves failed draws unchanged", () => {
    const original = initialSave();
    const first = drawSupply(original, content, () => 0.99);
    expect(first.item?.kind).toBe("armor");
    expect(supplyPool(first.save, content)).not.toContain(first.item);
    const second = drawSupply(first.save, content, () => 0);
    const third = drawSupply(second.save, content, () => 0);
    expect(third.save.supply.items[second.item!.id]).toBe(2);
    expect(drawSupply(third.save, content).save).toBe(third.save);
    expect(drawSupply(original, content, () => 1).save).toBe(original);
    expect(drawSupply(original, { ...content, entities: [] }).save).toBe(
      original,
    );
  });

  it("awards a token only for the first activity completion", () => {
    const original = initialSave();
    const completed = completeActivity(original, "guardian-battle");
    expect(completed.supply.tokens).toBe(original.supply.tokens + 1);
    const draw = drawSupply(completed, content, () => 0);
    expect(completeActivity(draw.save, "guardian-battle")).toBe(draw.save);
  });
});

describe("field gear and consumables", () => {
  it("equips each slot independently and applies only the equipped bonuses", () => {
    const weapon = item("pulse-baton");
    const betterWeapon = item("arc-projector");
    const armor = item("mesh-vest");
    const original = initialSave();
    expect(equipGear(original, weapon)).toBe(original);
    const save = {
      ...original,
      supply: {
        ...original.supply,
        items: { [weapon.id]: 1, [betterWeapon.id]: 1, [armor.id]: 1 },
      },
    };
    const base = stats(save, content);
    const equipped = equipGear(equipGear(save, weapon), armor);
    expect(stats(equipped, content)).toMatchObject({
      attack: base.attack + weapon.amount,
      defense: base.defense + armor.amount,
    });
    const upgraded = equipGear(equipped, betterWeapon);
    expect(stats(upgraded, content).attack).toBe(
      base.attack + betterWeapon.amount,
    );
    const unequipped = equipGear(upgraded, betterWeapon);
    expect(stats(unequipped, content).attack).toBe(base.attack);
    expect(unequipped.supply.equipped.armor).toBe(armor.id);
    expect(parseSave(upgraded, content)).toEqual(upgraded);
  });

  it("uses one consumable only if it can restore the character", () => {
    const healing = item("patch-kit");
    const focus = item("focus-cell");
    const save = initialSave();
    save.supply.items = { [healing.id]: 1, [focus.id]: 2 };
    expect(useConsumable(save, healing)).toBe(save);
    save.character = { ...save.character, hp: 54, focus: 2 };
    const restored = useConsumable(useConsumable(save, healing), focus);
    expect(restored.character).toMatchObject({ hp: 60, focus: 8 });
    expect(restored.supply.items).toEqual({ [focus.id]: 1 });
    expect(useConsumable(restored, healing)).toBe(restored);
    const lost = { ...save, character: { ...save.character, hp: 0 } };
    expect(useConsumable(lost, healing)).toBe(lost);
  });

  it("rejects unknown items, duplicated gear and invalid loadout slots", () => {
    const save = initialSave();
    expect(() =>
      parseSave(
        { ...save, supply: { ...save.supply, items: { unknown: 1 } } },
        content,
      ),
    ).toThrow(/unknown item/);
    save.supply.items["pulse-baton"] = 2;
    expect(() => parseSave(save, content)).toThrow(/duplicate gear/);
    save.supply.items["pulse-baton"] = 1;
    save.supply.equipped.armor = "pulse-baton";
    expect(() => parseSave(save, content)).toThrow(/Invalid equipped armor/);
    save.supply.equipped = { weapon: "arc-projector", armor: null };
    expect(() => parseSave(save, content)).toThrow(/Invalid equipped weapon/);
  });
});
