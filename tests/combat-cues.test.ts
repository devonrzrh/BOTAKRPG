import { describe, expect, it } from "vitest";
import {
  answerBattle,
  createBattle,
  enemyTurn,
  guardTurn,
  selectSkill,
} from "../src/game/combat";
import { battleCue, combatCueDuration } from "../src/game/combatPresentation";
import { initialSave } from "../src/game/state";
import {
  validateContent,
  type Question,
  type Skill,
} from "../src/content/schema";
import raw from "../src/generated/content.json";

const content = validateContent(raw);
const questions = content.entities.filter(
  (entity): entity is Question => entity.type === "question",
);
const skill = (id = "insight") =>
  content.entities.find(
    (entity): entity is Skill => entity.type === "skill" && entity.id === id,
  )!;
const questionFor = (battle: ReturnType<typeof selectSkill>) =>
  questions.find((question) => question.id === battle.question)!;

describe("combat presentation cues", () => {
  it("uses remaining HP for lethal hits so the pending meter cannot invent health", () => {
    const save = initialSave();
    save.character.hp = 3;
    const battle = { ...createBattle(), phase: "feedback" as const };
    const turn = enemyTurn(battle, save, content);
    expect(turn.battle.phase).toBe("lost");
    expect(turn.save.character.hp).toBe(0);
    const cue = battleCue(battle, turn.battle, save, turn.save, content, 1);
    expect(cue).toMatchObject({ kind: "enemy", amount: 3 });
    expect(turn.save.character.hp + cue!.amount).toBe(save.character.hp);
  });
  it("announces ECHO's phase change without treating a killing hit as a new phase", () => {
    const save = initialSave();
    const definition = content.entities.find(
      (e) => e.type === "activity" && e.id === "echo-battle",
    );
    if (definition?.type !== "activity" || !definition.enemy)
      throw new Error("Missing ECHO");
    const before = {
      ...createBattle(definition.enemy),
      hp: 55,
      phase: "question" as const,
    };
    expect(
      battleCue(
        before,
        { ...before, hp: 44, phase: "feedback" },
        save,
        save,
        content,
        1,
      )?.phaseShift,
    ).toBe(true);
    expect(
      battleCue(
        before,
        { ...before, hp: 0, phase: "won" },
        save,
        save,
        content,
        2,
      )?.phaseShift,
    ).toBe(false);
  });
  it("describes correct and incorrect player answers from model state", () => {
    const save = initialSave();
    const battle = selectSkill(createBattle(), save, skill(), questions);
    const question = questionFor(battle);
    const hit = answerBattle(battle, save, content, question.answer);
    expect(
      battleCue(battle, hit.battle, save, hit.save, content, 1),
    ).toMatchObject({
      sequence: 1,
      kind: "player",
      skill: "insight",
      amount: battle.hp - hit.battle.hp,
      heavy: false,
      blocked: false,
      defeated: false,
    });
    const miss = answerBattle(battle, save, content, [
      (question.answer[0] + 1) % question.options.length,
    ]);
    expect(
      battleCue(battle, miss.battle, save, miss.save, content, 2),
    ).toMatchObject({
      sequence: 2,
      kind: "miss",
      skill: "insight",
      amount: 0,
    });
  });

  it("describes enemy hits and shield blocking using actual damage", () => {
    const save = initialSave();
    const battle = { ...createBattle(), phase: "feedback" as const };
    const turn = enemyTurn(battle, save, content);
    expect(
      battleCue(battle, turn.battle, save, turn.save, content, 3),
    ).toMatchObject({
      kind: "enemy",
      amount: save.character.hp - turn.save.character.hp,
    });

    const shielded = {
      ...battle,
      effects: [{ id: "shield" as const, remaining: 2, magnitude: 2 }],
    };
    const blocked = enemyTurn(shielded, save, content);
    expect(
      battleCue(shielded, blocked.battle, save, blocked.save, content, 4),
    ).toMatchObject({
      kind: "enemy",
      blocked: true,
      amount: save.character.hp - blocked.save.character.hp,
    });
  });

  it("marks guarding as blocked and recovery as a non attack cue", () => {
    const save = initialSave();
    const battle = { ...createBattle(), turn: 2 };
    const guarded = guardTurn(battle, save, content);
    expect(
      battleCue(
        battle,
        guarded.battle,
        save,
        guarded.save,
        content,
        5,
        "guard",
      ),
    ).toMatchObject({
      kind: "enemy",
      blocked: true,
    });

    const recovering = {
      ...createBattle(),
      turn: 3,
      phase: "feedback" as const,
    };
    const recovered = enemyTurn(recovering, save, content);
    expect(
      battleCue(recovering, recovered.battle, save, recovered.save, content, 6),
    ).toMatchObject({
      kind: "recover",
      amount: 0,
      blocked: false,
    });
  });

  it("reports poison kills without inventing an enemy attack", () => {
    const save = initialSave();
    const battle = {
      ...createBattle(),
      phase: "feedback" as const,
      hp: 2,
      effects: [{ id: "poison" as const, magnitude: 2, remaining: 1 }],
    };
    const turn = enemyTurn(battle, save, content);
    expect(
      battleCue(battle, turn.battle, save, turn.save, content, 7),
    ).toMatchObject({
      kind: "poison",
      amount: 2,
      defeated: true,
    });
    expect(turn.save.character.hp).toBe(save.character.hp);
    const choosing = { ...battle, phase: "choose" as const };
    const guarded = guardTurn(choosing, save, content);
    expect(
      battleCue(
        choosing,
        guarded.battle,
        save,
        guarded.save,
        content,
        11,
        "guard",
      ),
    ).toMatchObject({ kind: "poison", defeated: true });
  });

  it("marks a player finisher, ignores unrelated state and hint changes, and preserves inputs", () => {
    const save = initialSave();
    const battle = selectSkill(
      createBattle({
        id: "test",
        title: "Test",
        hp: 1,
        attack: 1,
        mixedQuestions: false,
      }),
      save,
      skill(),
      questions,
    );
    const question = questionFor(battle);
    const beforeBattle = structuredClone(battle);
    const beforeSave = structuredClone(save);
    const result = answerBattle(battle, save, content, question.answer);
    expect(
      battleCue(battle, result.battle, save, result.save, content, 8),
    ).toMatchObject({ kind: "player", defeated: true });
    expect(battle).toEqual(beforeBattle);
    expect(save).toEqual(beforeSave);

    expect(
      battleCue(
        battle,
        { ...battle, log: [...battle.log, "Hint shown"] },
        save,
        save,
        content,
        9,
      ),
    ).toBeNull();
    expect(
      battleCue(
        battle,
        battle,
        { ...save, settings: { ...save.settings, reducedMotion: true } },
        save,
        content,
        10,
      ),
    ).toBeNull();
  });

  it("uses the shorter cue duration for reduced motion", () => {
    expect(combatCueDuration(false)).toBe(650);
    expect(combatCueDuration(true)).toBe(200);
  });
});
