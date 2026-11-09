import { describe, expect, it } from "vitest";
import {
  answerBattle,
  comboBonus,
  createBattle,
  enemyTurn,
  guardTurn,
  previewDamage,
  selectSkill,
} from "../src/game/combat";
import { initialSave } from "../src/game/state";
import { battleCue } from "../src/game/combatPresentation";
import {
  validateContent,
  type Question,
  type Skill,
} from "../src/content/schema";
import raw from "../src/generated/content.json";

const content = validateContent(raw);
const questions = content.entities.filter(
  (e): e is Question => e.type === "question",
);
const skill = content.entities.find(
  (e): e is Skill => e.type === "skill" && e.id === "insight",
)!;
const encounter = () =>
  createBattle({
    id: "combo-test",
    title: "Target",
    hp: 1000,
    attack: 1,
    mixedQuestions: false,
  });

describe("attack combos", () => {
  it("rewards consecutive hits, matches previews, and caps the bonus", () => {
    let battle = encounter(),
      save = initialSave();
    const base = previewDamage(battle, save, skill, content);
    for (let hit = 1; hit <= 6; hit++) {
      const selected = selectSkill(battle, save, skill, questions);
      const question = questions.find((q) => q.id === selected.question)!;
      const preview = previewDamage(selected, save, skill, content);
      const result = answerBattle(selected, save, content, question.answer);
      expect(result.battle.combo).toBe(hit);
      expect(battle.hp - result.battle.hp).toBe(preview);
      expect(preview).toBe(Math.floor(base * (1 + Math.min(hit - 1, 3) / 10)));
      ({ battle, save } = enemyTurn(result.battle, result.save, content));
    }
    expect(comboBonus(100)).toBe(30);
  });

  it("breaks on a wrong answer and restarts without a bonus", () => {
    const save = initialSave();
    const selected = selectSkill(
      { ...encounter(), combo: 3 },
      save,
      skill,
      questions,
    );
    const result = answerBattle(selected, save, content, [-1]);
    expect(result.correct).toBe(false);
    expect(result.battle.combo).toBe(0);
    expect(result.battle.hp).toBe(selected.hp);
    expect(result.battle.log).toContain("Combo broken.");
    expect(
      battleCue(selected, result.battle, save, result.save, content, 1)
        ?.comboBroken,
    ).toBe(true);
    expect(previewDamage(result.battle, save, skill, content)).toBe(
      previewDamage(encounter(), save, skill, content),
    );
  });

  it("preserves combos through defense and enemy damage, but starts each encounter fresh", () => {
    const save = initialSave();
    const battle = { ...encounter(), attack: 20, combo: 3 };
    const guarded = guardTurn(battle, save, content);
    expect(guarded.battle.combo).toBe(3);
    expect(guarded.save.character.hp).toBeLessThan(save.character.hp);
    expect(encounter().combo).toBe(0);
    // Missing transient state defaults safely to the first hit.
    expect(
      previewDamage({ ...battle, combo: undefined }, save, skill, content),
    ).toBe(previewDamage(encounter(), save, skill, content));
  });
});
