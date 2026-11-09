import { describe, expect, it } from "vitest";
import {
  battleChanges,
  battleFeedbackSnapshot,
} from "../src/game/battleFeedback";
import {
  answerBattle,
  createBattle,
  enemyTurn,
  selectMomentum,
  selectSkill,
} from "../src/game/combat";
import { initialSave } from "../src/game/state";
import { validateContent, type Skill } from "../src/content/schema";
import raw from "../src/generated/content.json";

const content = validateContent(raw);
const activity = content.entities.find(
  (e) => e.type === "activity" && e.id === "guardian-battle",
)!;
if (activity.type !== "activity" || !activity.enemy)
  throw new Error("Missing guardian");
const start = () => createBattle(activity.enemy!);
const save = initialSave();
const snapshot = (battle = start(), player = save) =>
  battleFeedbackSnapshot(battle, player, content);

describe("battle change feedback", () => {
  it("stays silent for initial state, unchanged values, settings and question selection", () => {
    const before = start();
    expect(battleChanges(snapshot(before), snapshot(before))).toEqual([]);
    const skill = content.entities.find(
      (e): e is Skill => e.type === "skill" && e.id === "insight",
    )!;
    const selected = selectSkill(
      before,
      save,
      skill,
      content.entities.filter((e) => e.type === "question"),
    );
    const edited = structuredClone(save);
    edited.settings.combatMuted = !save.settings.combatMuted;
    expect(battleChanges(snapshot(before), snapshot(selected, edited))).toEqual(
      [],
    );
  });

  it("describes a resolved shield attack using real resource and effect changes", () => {
    const skill = content.entities.find(
      (e): e is Skill => e.type === "skill" && e.effect === "shield",
    )!;
    const selected = selectSkill(
      start(),
      save,
      skill,
      content.entities.filter((e) => e.type === "question"),
    );
    const question = content.entities.find(
      (e) => e.type === "question" && e.id === selected.question,
    )!;
    if (question.type !== "question") throw new Error("Missing question");
    const result = answerBattle(selected, save, content, question.answer);
    const changes = battleChanges(
      snapshot(selected),
      snapshot(result.battle, result.save),
    );
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: "focus", delta: -skill.cost }),
        expect.objectContaining({
          target: "enemy",
          delta: result.battle.hp - selected.hp,
        }),
        expect.objectContaining({
          id: "effect-shield",
          text: expect.stringContaining("Shield applied"),
        }),
        expect.objectContaining({ target: "momentum", delta: 25 }),
      ]),
    );
    expect(changes.some((change) => change.target === "health")).toBe(false);
  });

  it("announces renewed, last-turn and expired effects without repeating unchanged statuses", () => {
    const before = snapshot();
    before.effects = [{ id: "shield", remaining: 2, magnitude: 4 }];
    expect(
      battleChanges(before, {
        ...before,
        effects: [{ id: "shield", remaining: 1, magnitude: 4 }],
      }),
    ).toContainEqual(expect.objectContaining({ text: "Shield · last turn" }));
    expect(battleChanges(before, { ...before, effects: [] })).toContainEqual(
      expect.objectContaining({ text: "Shield expired" }),
    );
    expect(
      battleChanges(before, {
        ...before,
        effects: [{ id: "shield", remaining: 3, magnitude: 4 }],
      }),
    ).toContainEqual(
      expect.objectContaining({ text: "Shield renewed · 3 turns" }),
    );
    expect(battleChanges(before, { ...before })).toEqual([]);
  });

  it("separates momentum selection from spending, and announces finisher readiness once", () => {
    const battle = { ...start(), momentum: 75 };
    const selected = selectMomentum(battle, 50);
    expect(battleChanges(snapshot(battle), snapshot(selected))).toEqual([
      expect.objectContaining({ text: "Momentum selected · +50% next hit" }),
    ]);
    const before = { ...snapshot(selected), momentum: 80 };
    const after = {
      ...before,
      spend: 0,
      momentum: 100,
      phase: "feedback" as const,
    };
    const changes = battleChanges(before, after);
    expect(changes).toContainEqual(
      expect.objectContaining({ text: "Finisher ready" }),
    );
    expect(changes.some((change) => change.id === "momentum-selection")).toBe(
      false,
    );
    expect(battleChanges(after, { ...after })).toEqual([]);
  });

  it("reports clamped lethal damage and suppresses new intent after defeat", () => {
    const battle = { ...start(), phase: "feedback" as const };
    const player = structuredClone(save);
    player.character.hp = 1;
    const result = enemyTurn(battle, player, content);
    const changes = battleChanges(
      snapshot(battle, player),
      snapshot(result.battle, result.save),
    );
    expect(changes).toContainEqual(
      expect.objectContaining({ target: "health", delta: -1, previous: 1 }),
    );
    expect(changes.some((change) => change.target === "intent")).toBe(false);
  });

  it("announces weakness, break and phase changes but clears feedback for retries and other enemies", () => {
    const before = snapshot();
    const after = {
      ...before,
      staggered: true,
      weakness: "Probe",
      bossPhase: "Phase 2",
      turn: before.turn + 1,
    };
    const changes = battleChanges(before, after);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "stance",
          text: "Stance broken · response skipped",
        }),
        expect.objectContaining({
          id: "weakness",
          text: "Weakness revealed · Probe",
        }),
        expect.objectContaining({
          id: "boss-phase",
          text: "Enemy phase · Phase 2",
        }),
        expect.objectContaining({ id: "intent" }),
      ]),
    );
    expect(battleChanges({ ...after, phase: "lost" }, before)).toEqual([]);
    expect(battleChanges(after, { ...before, enemyId: "another" })).toEqual([]);
  });
});
