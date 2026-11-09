import { describe, expect, it } from "vitest";
import {
  analyzeBattle,
  answerBattle,
  canSpare,
  createBattle,
  enemyIntent,
  enemyTurn,
  evadeTurn,
  guardTurn,
  selectMomentum,
  selectFinisher,
  selectSkill,
  spareBattle,
  type CombatTactics,
} from "../src/game/combat";
import { initialSave } from "../src/game/state";
import {
  validateContent,
  type Question,
  type Skill,
} from "../src/content/schema";
import raw from "../src/generated/content.json";

const content = validateContent(raw);
const tactics: CombatTactics = {
  weakness: "insight",
  pattern: ["strike", "heavy", "recover"],
  resolve: 1,
  act: {
    prompt: "signal",
    options: ["yes", "no"],
    answer: 0,
    explanation: "A trace remains.",
  },
  spare: true,
  boss: false,
};

describe("profiled combat depth", () => {
  it("resolves a charged finisher without stacking spending or regenerating momentum", () => {
    const save = initialSave();
    const skill = content.entities.find(
      (e): e is Skill => e.type === "skill" && e.id === "insight",
    )!;
    const questions = content.entities.filter(
      (e): e is Question => e.type === "question",
    );
    const base = {
      ...createBattle({
        id: "unit",
        title: "Unit",
        hp: 500,
        attack: 10,
        mixedQuestions: true,
        tactics,
      }),
      momentum: 100,
    };
    const selected = selectFinisher(selectMomentum(base, 75), save, questions);
    const q = questions.find((q) => q.id === selected.question)!;
    const result = answerBattle(selected, save, content, q.answer);
    expect(result.battle.momentumSpend).toBe(0);
    expect(base.hp - result.battle.hp).toBe((6 + skill.power) * 3);
    expect(result.battle.momentum).toBe(0);
    expect(result.battle.correctAnswers).toBe(1);
    expect(guardTurn(base, save, content).battle.momentum).toBe(100);
    expect(selectMomentum(base, 0).momentumSpend).toBe(0);
    expect(
      canSpare({
        ...base,
        hp: 175,
        analyzed: true,
        correctAnswers: 2,
        tactics: { ...tactics, boss: true },
      }),
    ).toBe(false);
    expect(
      canSpare({
        ...base,
        hp: 175,
        analyzed: true,
        correctAnswers: 3,
        tactics: { ...tactics, boss: true },
      }),
    ).toBe(true);
  });
  it("breaks on weakness and consumes exactly one response before stagger damage", () => {
    const save = initialSave();
    const insight = content.entities.find(
      (e): e is Skill => e.type === "skill" && e.id === "insight",
    )!;
    const qs = content.entities.filter((e) => e.type === "question");
    const initial = createBattle({
      id: "unit",
      title: "Unit",
      hp: 80,
      attack: 10,
      mixedQuestions: true,
      tactics,
    });
    const selected = selectSkill(initial, save, insight, qs);
    const question = qs.find((q) => q.id === selected.question)!;
    const result = answerBattle(
      selected,
      save,
      content,
      question.answer,
    ).battle;
    expect(result.breakFresh).toBe(true);
    expect(result.staggered).toBe(true);
    const before = save.character.hp;
    const broken = enemyTurn({ ...result, phase: "feedback" }, save, content);
    expect(broken.battle.turn).toBe(2);
    expect(broken.save.character.hp).toBe(before);
    expect(broken.battle.staggered).toBe(true);
    const nextSkill = selectSkill(broken.battle, broken.save, insight, qs);
    const nextQuestion = qs.find((q) => q.id === nextSkill.question)!;
    const damageBefore = broken.battle.hp;
    const staggerHit = answerBattle(
      nextSkill,
      broken.save,
      content,
      nextQuestion.answer,
    ).battle;
    expect(damageBefore - staggerHit.hp).toBe(
      Math.floor((6 + insight.power) * 1.5),
    );
    expect(staggerHit.staggered).toBe(false);
    expect(staggerHit.resolve).toBe(0);
    const afterBreak = enemyTurn(staggerHit, broken.save, content);
    expect(afterBreak.battle.turn).toBe(3);
    expect(afterBreak.save.character.hp).toBeLessThan(broken.save.character.hp);
  });

  it("grants guard momentum and validates spending in points", () => {
    const save = initialSave();
    const battle = createBattle({
      id: "unit",
      title: "Unit",
      hp: 80,
      attack: 10,
      mixedQuestions: true,
      tactics,
    });
    const guarded = guardTurn(battle, save, content);
    expect(guarded.battle.momentum).toBe(25);
    expect(selectMomentum(guarded.battle, 25).momentumSpend).toBe(25);
    expect(() => selectMomentum(guarded.battle, 50)).toThrow();
    expect(() => selectMomentum(battle, -1)).toThrow();
    expect(() => selectMomentum(battle, 4)).toThrow();
  });

  it("spends momentum on a wrong answer and leaves the input state untouched", () => {
    const save = initialSave();
    const skill = content.entities.find(
      (e): e is Skill => e.type === "skill" && e.id === "insight",
    )!;
    const questions = content.entities.filter((e) => e.type === "question");
    const base = {
      ...createBattle({
        id: "unit",
        title: "Unit",
        hp: 80,
        attack: 10,
        mixedQuestions: true,
        tactics,
      }),
      momentum: 25,
    };
    const selected = selectSkill(
      selectMomentum(base, 25),
      save,
      skill,
      questions,
    );
    const q = questions.find((item) => item.id === selected.question)!;
    const snapshot = structuredClone({ battle: selected, save });
    const miss = answerBattle(
      selected,
      save,
      content,
      q.answer.length === 1 ? [(q.answer[0] + 1) % q.options.length] : [],
    );
    expect(miss.correct).toBe(false);
    expect(miss.battle.momentum).toBe(0);
    expect(miss.battle.momentumSpend).toBe(0);
    expect(selected).toEqual(snapshot.battle);
    expect(save).toEqual(snapshot.save);
  });

  it("uses the battle lesson pool for finishers and spends momentum on a miss", () => {
    const save = initialSave();
    const questions = content.entities.filter(
      (e): e is Question =>
        e.type === "question" && e.lesson === "source-ai-01",
    );
    const profile = createBattle({
      id: "unit",
      title: "Unit",
      hp: 80,
      attack: 10,
      mixedQuestions: true,
      lessons: ["source-ai-01"],
      tactics,
    });
    const charged = { ...profile, momentum: 100 };
    const selected = selectFinisher(
      charged,
      save,
      content.entities.filter((e) => e.type === "question"),
    );
    expect(questions.some((q) => q.id === selected.question)).toBe(true);
    const q = questions.find((item) => item.id === selected.question)!;
    const miss = answerBattle(selected, save, content, [
      (q.answer[0] + 1) % q.options.length,
    ]);
    expect(miss.correct).toBe(false);
    expect(miss.battle.momentum).toBe(0);
    expect(miss.battle.finisher).toBe(false);
    expect(miss.battle.phase).toBe("feedback");
    expect(() => selectFinisher(profile, save, questions)).toThrow();
  });

  it("gates analysis, pacification, and heavy evade; clamps collision inputs", () => {
    const save = initialSave();
    let battle = createBattle({
      id: "unit",
      title: "Unit",
      hp: 80,
      attack: 10,
      mixedQuestions: true,
      tactics,
    });
    expect(() => spareBattle(battle, save)).toThrow();
    const analyzed = analyzeBattle(battle, save, content, 0);
    expect(analyzed.battle.weaknessKnown).toBe(true);
    expect(analyzed.battle.analyzed).toBe(true);
    expect(analyzed.battle.phase).toBe("choose");
    battle = { ...analyzed.battle, hp: 50, phase: "choose", correctAnswers: 1 };
    expect(canSpare({ ...battle, analyzed: false })).toBe(false);
    expect(canSpare({ ...battle, correctAnswers: 0 })).toBe(false);
    expect(canSpare({ ...battle, hp: 53 })).toBe(false);
    expect(canSpare(battle)).toBe(true);
    expect(spareBattle(battle, save).battle.resolution).toBe("pacified");
    const heavy = {
      ...createBattle({
        id: "unit",
        title: "Unit",
        hp: 80,
        attack: 10,
        mixedQuestions: true,
        tactics,
      }),
      turn: 2,
    };
    expect(enemyIntent(heavy, save, content).kind).toBe("heavy");
    const damage = enemyIntent(heavy, save, content).damage;
    const evaded = evadeTurn(heavy, save, content, 0);
    expect(evaded.battle.log.some((x) => x.includes("80%"))).toBe(true);
    expect(save.character.hp - evaded.save.character.hp).toBe(
      Math.floor(damage * (1 - 0.8)),
    );
    expect(() => evadeTurn(heavy, save, content, 4)).toThrow();
    expect(() => evadeTurn({ ...heavy, turn: 1 }, save, content, 0)).toThrow();
  });
});
