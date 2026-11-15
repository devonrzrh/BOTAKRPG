import { expect, it } from "vitest";
import { validateContent } from "../src/content/schema";
import { applyDebugSaveAction } from "../src/game/debug";
import { activityUnlocked } from "../src/game/investigation";
import { initialSave, parseSave } from "../src/game/state";
import raw from "../src/generated/content.json";

const content = validateContent(raw);

it("unlocks every activity but keeps the final battle eligible for its first clear", () => {
  const save = initialSave();
  const unlocked = parseSave(
    applyDebugSaveAction(save, content, { type: "unlock-all" }),
    content,
  );
  const activities = content.entities.filter(
    (entity) => entity.type === "activity",
  );
  expect(
    activities.every(({ id }) => activityUnlocked(unlocked, id, content)),
  ).toBe(true);
  expect(unlocked.completed).not.toContain("echo-battle");
  expect(save.completed).toEqual([]);

  const completed = parseSave(
    applyDebugSaveAction(unlocked, content, { type: "complete-all" }),
    content,
  );
  expect(completed.completed).toHaveLength(activities.length);
  expect(completed.completed).toContain("echo-battle");
  expect(
    applyDebugSaveAction(completed, content, { type: "complete-all" }),
  ).toEqual(completed);
});

it("preserves valid mastery and gear records when applying grants repeatedly", () => {
  const save = initialSave();
  const equip = { type: "equip-item", id: "pulse-baton" } as const;
  const equipped = applyDebugSaveAction(save, content, equip);
  expect(equipped.supply.items["pulse-baton"]).toBe(1);
  expect(equipped.supply.equipped.weapon).toBe("pulse-baton");
  const supplied = applyDebugSaveAction(equipped, content, {
    type: "all-items",
  });
  const mastered = applyDebugSaveAction(supplied, content, {
    type: "all-mastery",
  });
  const repeated = applyDebugSaveAction(mastered, content, {
    type: "all-mastery",
  });
  expect(repeated).toEqual(mastered);
  expect(parseSave(repeated, content).supply.equipped.weapon).toBe(
    "pulse-baton",
  );
});
