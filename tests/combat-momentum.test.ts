import { describe, expect, it } from "vitest";
import {
  analyzeBattle,
  answerBattle,
  createBattle,
  enemyTurn,
  guardTurn,
  previewDamage,
  selectFinisher,
  selectMomentum,
  selectSkill,
  type CombatTactics,
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
const encounter = (tactics?: CombatTactics) =>
  createBattle({
    id: "momentum-test",
    title: "Target",
    hp: 1000,
    attack: 10,
    mixedQuestions: false,
    tactics,
  });
const tactics: CombatTactics = {
  weakness: "insight",
  pattern: ["recover"],
  resolve: 20,
  act: {
    prompt: "Evidence?",
    options: ["record", "guess"],
    answer: 0,
    explanation: "Verified.",
  },
  spare: true,
  boss: false,
};

describe("one combat momentum resource", () => {
  it("earns 25 per correct hit, caps at 100, and has no hidden consecutive-hit damage multiplier", () => {
    let battle = encounter(),
      save = initialSave();
    const base = previewDamage(battle, save, skill, content);
    for (let hit = 1; hit <= 6; hit++) {
      const selected = selectSkill(battle, save, skill, questions);
      const question = questions.find((q) => q.id === selected.question)!;
      const result = answerBattle(selected, save, content, question.answer);
      expect(result.battle.momentum).toBe(Math.min(100, hit * 25));
      expect(battle.hp - result.battle.hp).toBe(base);
      expect(previewDamage(selected, save, skill, content)).toBe(base);
      ({ battle, save } = enemyTurn(
        { ...result.battle, turn: 3 },
        result.save,
        content,
      ));
    }
    expect(encounter().momentum).toBe(0);
  });

  it.each([25, 50, 75])(
    "spends %i points before earning hit momentum and matches the damage preview",
    (spend) => {
      const save = initialSave();
      const battle = { ...encounter(), momentum: 75 };
      const selected = selectSkill(
        selectMomentum(battle, spend),
        save,
        skill,
        questions,
      );
      const result = answerBattle(
        selected,
        save,
        content,
        questions.find((q) => q.id === selected.question)!.answer,
      );
      expect(battle.hp - result.battle.hp).toBe(
        Math.floor(11 * (1 + spend / 100)),
      );
      expect(result.battle.momentum).toBe(Math.min(100, 75 - spend + 25));
      expect(result.battle.momentumSpend).toBe(0);
      expect(battle.momentum).toBe(75);
      expect(
        battleCue(selected, result.battle, save, result.save, content, 1)
          ?.special,
      ).toBe("momentum");
    },
  );

  it("preserves unspent momentum on misses and rejects invalid or unaffordable spending", () => {
    const save = initialSave(),
      battle = { ...encounter(), momentum: 50 };
    const selected = selectSkill(
      selectMomentum(battle, 25),
      save,
      skill,
      questions,
    );
    const miss = answerBattle(selected, save, content, [-1]);
    expect(miss.battle.momentum).toBe(25);
    expect(miss.battle.hp).toBe(battle.hp);
    expect(miss.battle.momentumSpend).toBe(0);
    expect(
      battleCue(selected, miss.battle, save, miss.save, content, 1)?.kind,
    ).toBe("miss");
    for (const value of [-25, 1, 24, 26, 75, 100, NaN, Infinity])
      expect(() => selectMomentum(battle, value)).toThrow(
        "Momentum unavailable",
      );
    expect(() => selectMomentum({ ...battle, phase: "question" }, 0)).toThrow();
    expect(selectMomentum(battle, 0).momentumSpend).toBe(0);
  });

  it("adds the weakness bonus, successful analysis, guarding and actual incoming damage to the same meter", () => {
    const save = initialSave(),
      battle = encounter(tactics);
    const selected = selectSkill(battle, save, skill, questions);
    const hit = answerBattle(
      selected,
      save,
      content,
      questions.find((q) => q.id === selected.question)!.answer,
    );
    expect(hit.battle.momentum).toBe(35);
    expect(analyzeBattle(battle, save, content, 0).battle.momentum).toBe(20);
    expect(analyzeBattle(battle, save, content, 1).battle.momentum).toBe(0);
    expect(guardTurn(battle, save, content).battle.momentum).toBe(15);
    expect(guardTurn(encounter(), save, content).battle.momentum).toBe(25);
    expect(
      enemyTurn({ ...encounter(), phase: "feedback" }, save, content).battle
        .momentum,
    ).toBe(10);
    const capped = guardTurn({ ...encounter(), momentum: 95 }, save, content);
    expect(capped.battle.momentum).toBe(100);
    const poisoned = enemyTurn(
      {
        ...encounter(),
        phase: "feedback",
        hp: 1,
        effects: [{ id: "poison", remaining: 1, magnitude: 2 }],
      },
      save,
      content,
    );
    expect(poisoned.battle.momentum).toBe(0);
    expect(poisoned.battle.phase).toBe("won");
  });

  it.each([true, false])(
    "uses a free triple Probe finisher and consumes the full meter on correct=%s",
    (correct) => {
      const save = initialSave();
      save.character.focus = 0;
      const battle = { ...encounter(), momentum: 100, momentumSpend: 75 };
      const selected = selectFinisher(battle, save, questions);
      expect(selected.momentumSpend).toBe(0);
      const question = questions.find((q) => q.id === selected.question)!;
      const result = answerBattle(
        selected,
        save,
        content,
        correct ? question.answer : [-1],
      );
      expect(result.battle.momentum).toBe(0);
      expect(result.battle.momentumSpend).toBe(0);
      expect(result.battle.finisher).toBe(false);
      expect(result.save.character.focus).toBe(0);
      expect(battle.hp - result.battle.hp).toBe(correct ? 33 : 0);
      expect(
        battleCue(selected, result.battle, save, result.save, content, 1)
          ?.special,
      ).toBe(correct ? "finisher" : undefined);
      expect(() =>
        selectFinisher({ ...battle, momentum: 99 }, save, questions),
      ).toThrow("Finisher unavailable");
    },
  );
});
