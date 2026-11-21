import { describe, expect, it } from "vitest";
import {
  answerBattle,
  bossReadout,
  createBattle,
  enemyIntent,
  enemyTurn,
  guardTurn,
  previewDamage,
  selectMomentum,
  selectSkill,
  type CombatTactics,
} from "../src/game/combat";
import { addXp, initialSave, parseSave, unlockSkill } from "../src/game/state";
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
const skill = (id: string) =>
  content.entities.find((e): e is Skill => e.type === "skill" && e.id === id)!;
const tactics = (mechanic: CombatTactics["mechanic"]): CombatTactics => ({
  mechanic,
  weakness: "insight",
  pattern: ["strike", "heavy", "recover"],
  resolve: 2,
  act: {
    prompt: "Evidence?",
    options: ["record", "guess"],
    answer: 0,
    explanation: "Verified.",
  },
  spare: true,
  boss: true,
});
const battle = (mechanic: CombatTactics["mechanic"], hp = 100) =>
  createBattle({
    id: `boss-${mechanic}`,
    title: "Boss",
    hp,
    attack: 10,
    mixedQuestions: true,
    tactics: tactics(mechanic!),
  });

describe("level-gated combat skills", () => {
  it.each([
    ["packet-relay", 200],
    ["window-exploit", 400],
    ["containment-burst", 600],
  ] as const)("unlocks %s at %i XP and preserves it on import", (id, xp) => {
    const entry = skill(id);
    const before = addXp(initialSave(), xp - 1);
    expect(unlockSkill(before, entry)).toBe(before);
    const eligible = addXp(before, 1);
    const learned = unlockSkill(eligible, entry);
    expect(learned.character.skills).toContain(id);
    expect(unlockSkill(learned, entry)).toBe(learned);
    expect(parseSave(JSON.parse(JSON.stringify(learned)), content)).toEqual(
      learned,
    );
  });

  it("builds extra Momentum only when Packet Relay hits", () => {
    const entry = skill("packet-relay");
    const save = unlockSkill(addXp(initialSave(), 200), entry);
    const selected = selectSkill(battle("mimic"), save, entry, questions);
    const q = questions.find((q) => q.id === selected.question)!;
    const hit = answerBattle(selected, save, content, q.answer);
    expect(hit.battle.momentum).toBe(45);
    expect(hit.save.character.focus).toBe(save.character.focus - 2);
    expect(answerBattle(selected, save, content, []).battle.momentum).toBe(0);
    expect(
      answerBattle({ ...selected, momentum: 90 }, save, content, q.answer)
        .battle.momentum,
    ).toBe(100);
  });

  it("previews and applies Window Exploit's bonus on recovery turns", () => {
    const entry = skill("window-exploit");
    const save = unlockSkill(addXp(initialSave(), 400), entry);
    const strike = battle("mimic");
    const opening = { ...strike, turn: 3 };
    const damage = previewDamage(opening, save, entry, content);
    expect(damage).toBe(previewDamage(strike, save, entry, content) + 12);
    expect(
      previewDamage({ ...strike, breakFresh: true }, save, entry, content),
    ).toBe(previewDamage(strike, save, entry, content));
    const selected = selectSkill(opening, save, entry, questions);
    const q = questions.find((q) => q.id === selected.question)!;
    expect(answerBattle(selected, save, content, q.answer).battle.hp).toBe(
      opening.hp - damage,
    );
  });

  it("applies Containment Burst's damage and shield for eight Focus", () => {
    const entry = skill("containment-burst");
    const save = unlockSkill(addXp(initialSave(), 600), entry);
    const base = battle("mimic");
    const selected = selectSkill(base, save, entry, questions);
    const q = questions.find((q) => q.id === selected.question)!;
    const hit = answerBattle(selected, save, content, q.answer);
    expect(hit.save.character.focus).toBe(save.character.focus - 8);
    expect(hit.battle.hp).toBe(base.hp - 37);
    expect(hit.battle.effects).toEqual([
      { id: "shield", remaining: 2, magnitude: 5 },
    ]);
  });
});

describe("distinct boss mechanics", () => {
  it("keeps every boss readout compact for the battle HUD", () => {
    for (const mechanic of ["routing", "archive", "mimic", "echo"] as const)
      expect(
        bossReadout(battle(mechanic))!.description.length,
      ).toBeLessThanOrEqual(90);
  });
  it("lets earned Momentum pierce the Warden firewall and aligns damage preview", () => {
    const save = initialSave(),
      base = battle("routing");
    const insight = skill("insight"),
      ward = skill("ward");
    expect(previewDamage(base, save, insight, content)).toBe(5);
    expect(previewDamage(base, save, ward, content)).toBe(4);
    const guarded = guardTurn(base, save, content).battle;
    expect(guarded.momentum).toBe(25);
    expect(
      previewDamage(selectMomentum(guarded, 25), save, insight, content),
    ).toBe(13);
    const boosted = selectMomentum({ ...base, momentum: 25 }, 25);
    expect(previewDamage(boosted, save, ward, content)).toBe(11);
    expect(
      previewDamage({ ...base, staggered: true }, save, insight, content),
    ).toBe(16);
    const selected = selectSkill(base, save, insight, questions, content);
    const result = answerBattle(
      selected,
      save,
      content,
      questions.find((q) => q.id === selected.question)!.answer,
    );
    expect(base.hp - result.battle.hp).toBe(
      previewDamage(selected, save, insight, content),
    );
  });

  it("opens the archive for one attack after Guard", () => {
    const save = initialSave(),
      base = battle("archive");
    expect(previewDamage(base, save, skill("insight"), content)).toBe(5);
    const opened = guardTurn(base, save, content).battle;
    expect(opened.archiveOpen).toBe(true);
    expect(bossReadout(opened)?.phase).toBe("Open");
    expect(previewDamage(opened, save, skill("insight"), content)).toBe(11);
    const attack = selectSkill(
      opened,
      save,
      skill("insight"),
      questions,
      content,
    );
    const question = questions.find((q) => q.id === attack.question)!;
    const used = answerBattle(attack, save, content, question.answer).battle;
    expect(used.archiveOpen).toBe(false);
    const ready = enemyTurn(used, save, content).battle;
    const nextAttack = selectSkill(
      ready,
      save,
      skill("insight"),
      questions,
      content,
    );
    const nextQuestion = questions.find((q) => q.id === nextAttack.question)!;
    const wrongAnswer = nextQuestion.answer[0] === 0 ? [1] : [0];
    expect(
      answerBattle(nextAttack, save, content, wrongAnswer).battle.archiveOpen,
    ).toBe(false);
  });

  it("lets Mimic counterplay switch skills or clear its learned skill with Guard", () => {
    const save = initialSave(),
      insight = skill("insight"),
      base = battle("mimic");
    const selected = selectSkill(base, save, insight, questions, content);
    const question = questions.find((q) => q.id === selected.question)!;
    const hit = answerBattle(selected, save, content, question.answer).battle;
    expect(hit.mechanicSkill).toBe("insight");
    expect(previewDamage(hit, save, insight, content)).toBe(5);
    expect(previewDamage(hit, save, skill("ward"), content)).toBe(9);
    const ready = enemyTurn(hit, save, content).battle;
    const repeated = selectSkill(ready, save, insight, questions, content);
    const repeatedQuestion = questions.find((q) => q.id === repeated.question)!;
    const expectedDamage = previewDamage(repeated, save, insight, content);
    const repeatedHit = answerBattle(
      repeated,
      save,
      content,
      repeatedQuestion.answer,
    ).battle;
    expect(ready.hp - repeatedHit.hp).toBe(expectedDamage);
    const readyAgain = enemyTurn(repeatedHit, save, content).battle;
    expect(
      guardTurn(readyAgain, save, content).battle.mechanicSkill,
    ).toBeUndefined();
  });

  it("shifts ECHO at half health and telegraphs stronger Phase 2 turns", () => {
    const save = initialSave(),
      echo = { ...battle("echo", 100), hp: 50, turn: 1 };
    expect(bossReadout(echo)?.phase).toBe("Phase 2");
    expect(enemyIntent(echo, save, content).damage).toBeGreaterThan(
      enemyIntent({ ...echo, hp: 100 }, save, content).damage,
    );
    expect(enemyIntent({ ...echo, hp: 50, turn: 3 }, save, content).kind).toBe(
      "recover",
    );
  });

  it("honors the already telegraphed response when a hit crosses the phase threshold", () => {
    const save = initialSave();
    const before = { ...battle("echo", 100), hp: 55, turn: 2 };
    const intent = enemyIntent(before, save, content);
    const selected = selectSkill(
      before,
      save,
      skill("insight"),
      questions,
      content,
    );
    const hit = answerBattle(
      selected,
      save,
      content,
      questions.find((q) => q.id === selected.question)!.answer,
    );
    expect(bossReadout(hit.battle)?.phase).toBe("Phase 2");
    expect(enemyIntent(hit.battle, hit.save, content)).toEqual(intent);
    const response = enemyTurn(hit.battle, hit.save, content);
    expect(hit.save.character.hp - response.save.character.hp).toBe(
      intent.damage,
    );
    expect(
      enemyIntent({ ...response.battle, turn: 4 }, response.save, content)
        .damage,
    ).toBeGreaterThan(
      enemyIntent({ ...before, turn: 4 }, save, content).damage,
    );
  });

  it("logs ECHO's threshold shift once and keeps earlier battle history", () => {
    const save = initialSave();
    const echo = {
      ...battle("echo", 100),
      hp: 55,
      log: ["Earlier clue remains."],
    };
    const selected = selectSkill(
      echo,
      save,
      skill("insight"),
      questions,
      content,
    );
    const question = questions.find((q) => q.id === selected.question)!;
    const shifted = answerBattle(
      selected,
      save,
      content,
      question.answer,
    ).battle;
    expect(shifted.hp).toBeLessThanOrEqual(shifted.maxHp / 2);
    expect(shifted.log).toContain("Earlier clue remains.");
    expect(
      shifted.log.filter((line) => line.includes("shifts into Phase 2")),
    ).toHaveLength(1);
    const second = selectSkill(
      { ...shifted, phase: "choose" },
      save,
      skill("insight"),
      questions,
      content,
    );
    const secondQuestion = questions.find((q) => q.id === second.question)!;
    const stillPhaseTwo = answerBattle(
      second,
      save,
      content,
      secondQuestion.answer,
    ).battle;
    expect(
      stillPhaseTwo.log.filter((line) => line.includes("shifts into Phase 2")),
    ).toHaveLength(1);
  });

  it("keeps ordinary battles on their legacy damage path", () => {
    const save = initialSave();
    const ordinary = createBattle({
      id: "ordinary",
      title: "Ordinary",
      hp: 40,
      attack: 5,
      mixedQuestions: false,
      tactics: { ...tactics(undefined), mechanic: undefined, boss: false },
    });
    expect(bossReadout(ordinary)).toBeNull();
    expect(previewDamage(ordinary, save, skill("insight"), content)).toBe(11);
  });
});
