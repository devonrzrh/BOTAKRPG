import { it, expect } from "vitest";
import { createBattle } from "../src/game/combat";
import { combatMotion } from "../src/game/combatPresentation";
it("distinguishes successful attacks and wrong answers including a finishing hit", () => {
  const before = { ...createBattle(), phase: "question" as const };
  expect(combatMotion(before, { ...before, phase: "feedback", hp: 50 })).toBe(
    "player",
  );
  expect(combatMotion(before, { ...before, phase: "feedback" })).toBe("miss");
  expect(combatMotion(before, { ...before, phase: "won", hp: 0 })).toBe(
    "player",
  );
});
it("shows enemy motion on turn resolution even when an item heals or poison ends combat", () => {
  const before = createBattle();
  expect(combatMotion(before, { ...before, turn: 2 })).toBe("enemy");
  expect(
    combatMotion(
      { ...before, phase: "feedback" },
      { ...before, phase: "won", hp: 0 },
    ),
  ).toBe("enemy");
  expect(combatMotion(before, { ...before, phase: "question" })).toBeNull();
  expect(
    combatMotion(
      { ...before, phase: "question" },
      { ...before, phase: "question", assisted: true },
    ),
  ).toBeNull();
});
