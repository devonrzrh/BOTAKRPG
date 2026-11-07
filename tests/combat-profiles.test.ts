import { expect, it } from "vitest";
import { validateContent, type Entity } from "../src/content/schema";
import { battleCue } from "../src/game/combatPresentation";
import {
  createBattle,
  enemyTurn,
  evadeTurn,
  spareBattle,
} from "../src/game/combat";
import { initialSave } from "../src/game/state";
import raw from "../src/generated/content.json";

const content = validateContent(raw);
const encounters = content.entities.filter(
  (e): e is Extract<Entity, { type: "activity" }> =>
    e.type === "activity" && e.template === "battle",
);
const enemy = encounters.find(
  (e) => e.type === "activity" && e.enemy?.tactics,
)!.enemy!;

it("gives every authored battle valid tactics and rejects invalid ACT and weakness references", () => {
  expect(encounters.length).toBeGreaterThan(30);
  for (const activity of encounters)
    expect(activity.enemy?.tactics, activity.id).toBeDefined();
  const invalid = structuredClone(content);
  const activity = invalid.entities.find(
    (e) => e.type === "activity" && e.enemy?.tactics,
  )!;
  if (activity.type !== "activity") throw new Error("missing activity");
  activity.enemy!.tactics!.act.answer = 99;
  expect(() => validateContent(invalid)).toThrow(
    new RegExp(activity.id + ": combat act answer"),
  );
  activity.enemy!.tactics!.act.answer = 0;
  invalid.entities = invalid.entities.filter(
    (e) => e.id !== activity.enemy!.tactics!.weakness,
  );
  expect(() => validateContent(invalid)).toThrow(/missing.*reference/);
});

it("presents breaks without invented focus recovery and surrender without a death cue", () => {
  const save = initialSave();
  const broken = {
    ...createBattle(enemy),
    phase: "feedback" as const,
    breakFresh: true,
    staggered: true,
  };
  const next = enemyTurn(broken, save, content);
  expect(
    battleCue(broken, next.battle, save, next.save, content, 1),
  ).toMatchObject({ kind: "recover", amount: 0, special: "break" });
  const ready = {
    ...createBattle(enemy),
    hp: 1,
    analyzed: true,
    correctAnswers: 3,
  };
  const spare = spareBattle(ready, save);
  expect(
    battleCue(ready, spare.battle, save, spare.save, content, 2),
  ).toMatchObject({
    kind: "recover",
    amount: 0,
    special: "pacify",
    defeated: false,
  });
  expect(spare.battle.hp).toBe(1);
});

it("presents actual reduced damage after a dodge", () => {
  const save = initialSave();
  const heavy = {
    ...createBattle(enemy),
    tactics: {
      ...enemy.tactics!,
      pattern: ["heavy", "strike"] as ("heavy" | "strike")[],
    },
  };
  const next = evadeTurn(heavy, save, content, 0);
  expect(
    battleCue(heavy, next.battle, save, next.save, content, 3, "evade"),
  ).toMatchObject({
    kind: "enemy",
    amount: save.character.hp - next.save.character.hp,
    special: "evade",
    blocked: true,
  });
});
