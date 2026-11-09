import { describe, expect, it } from "vitest";
import {
  createBattle,
  enemyIntent,
  enemyTurn,
  guardTurn,
} from "../src/game/combat";
import { initialSave, stats, type Save } from "../src/game/state";
import { validateContent } from "../src/content/schema";
import raw from "../src/generated/content.json";

const content = validateContent(raw);

describe("combat tactics", () => {
  it("telegraphs exact strike and heavy damage with defense and effects", () => {
    const save = initialSave();
    const battle = {
      ...createBattle({
        id: "test",
        title: "Test",
        hp: 20,
        attack: 10,
        mixedQuestions: false,
      }),
      effects: [{ id: "shield" as const, remaining: 2, magnitude: 3 }],
    };
    expect(enemyIntent(battle, save, content).damage).toBe(
      Math.max(1, 10 - stats(save, content).defense - 3),
    );
    expect(enemyIntent({ ...battle, turn: 2 }, save, content).damage).toBe(
      Math.max(1, Math.ceil(10 * 1.7) - stats(save, content).defense - 3),
    );
  });

  it("guards without a quiz, restoring focus and resolving exactly one turn", () => {
    const save = initialSave();
    save.character.focus = 2;
    const battle = {
      ...createBattle({
        id: "test",
        title: "Test",
        hp: 20,
        attack: 10,
        mixedQuestions: false,
      }),
      turn: 2,
    };
    const damage = enemyIntent(battle, save, content).damage;
    const result = guardTurn(battle, save, content);
    expect(result.save.character.hp).toBe(
      save.character.hp - Math.max(1, damage - Math.ceil(damage * 0.7)),
    );
    expect(result.save.character.focus).toBe(6);
    expect(result.battle.turn).toBe(3);
    expect(result.battle.phase).toBe("choose");
    expect(result.battle.guarding).toBe(false);
  });

  it("caps guard focus recovery at the character maximum", () => {
    const save = initialSave();
    save.character.focus = stats(save, content).maxFocus - 2;
    const result = guardTurn(
      createBattle({
        id: "test",
        title: "Test",
        hp: 20,
        attack: 1,
        mixedQuestions: false,
      }),
      save,
      content,
    );
    expect(result.save.character.focus).toBe(stats(save, content).maxFocus);
  });

  it("recovers focus on the third turn and ticks effects", () => {
    const save = initialSave();
    save.character.focus = 8;
    const battle = {
      ...createBattle({
        id: "test",
        title: "Test",
        hp: 20,
        attack: 10,
        mixedQuestions: false,
      }),
      turn: 3,
      phase: "feedback" as const,
      effects: [{ id: "shield" as const, remaining: 2, magnitude: 1 }],
    };
    const result = enemyTurn(battle, save, content);
    expect(result.save.character.focus).toBe(11);
    expect(result.save.character.hp).toBe(save.character.hp);
    expect(result.battle.effects[0].remaining).toBe(1);
    expect(result.battle.log.at(-1)).toBe("Test pauses. You recover 3 focus.");
  });

  it("does not attack after poison kills the enemy", () => {
    const save = initialSave();
    const battle = {
      ...createBattle(),
      phase: "feedback" as const,
      hp: 2,
      effects: [{ id: "poison" as const, remaining: 1, magnitude: 2 }],
    };
    const result = enemyTurn(battle, save, content);
    expect(result.battle.phase).toBe("won");
    expect(result.save.character.hp).toBe(save.character.hp);
  });

  it("applies poison before the strike without counting it twice", () => {
    const save = initialSave();
    const battle = {
      ...createBattle({
        id: "test",
        title: "Test",
        hp: 6,
        attack: 10,
        mixedQuestions: false,
      }),
      phase: "feedback" as const,
      effects: [{ id: "poison" as const, remaining: 1, magnitude: 4 }],
    };
    const result = enemyTurn(battle, save, content);
    expect(result.battle.hp).toBe(2);
    expect(result.save.character.hp).toBeLessThan(save.character.hp);
    expect(result.battle.log).toContain("Poison deals 4 damage.");
    expect(result.battle.log.some((line) => line.includes("strikes for"))).toBe(
      true,
    );
  });

  it("leaves invalid-phase inputs untouched", () => {
    const save = initialSave(),
      battle = { ...createBattle(), phase: "question" as const };
    expect(guardTurn(battle, save, content)).toEqual({ battle, save });
  });
});
