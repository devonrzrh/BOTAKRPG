import type { Battle } from "./combat";
import { enemyIntent } from "./combat";
import type { Save } from "./state";
import type { Content } from "../content/schema";

export interface BattleCue {
  sequence: number;
  kind: "player" | "enemy" | "miss" | "recover" | "poison";
  skill: string | null;
  amount: number;
  heavy: boolean;
  blocked: boolean;
  defeated: boolean;
  special?: "weakness" | "break" | "limit" | "pacify" | "evade";
  phaseShift?: boolean;
}
export const combatCueDuration = (reducedMotion: boolean) =>
  reducedMotion ? 200 : 650;

/** Visual events are derived from resolved actions, before XP can heal a level-up. */
export function battleCue(
  before: Battle,
  after: Battle,
  beforeSave: Save,
  afterSave: Save,
  content: Content,
  sequence: number,
  cause?: "guard" | "item" | "act" | "evade",
): BattleCue | null {
  if (before.enemyId !== after.enemyId) return null;
  const base = {
    sequence,
    skill: before.skill,
    amount: 0,
    heavy: false,
    blocked: false,
    defeated: after.phase === "won",
  };
  if (
    after.phase === "won" &&
    before.phase !== "won" &&
    after.resolution === "pacified"
  )
    return { ...base, kind: "recover", defeated: false, special: "pacify" };
  if (before.phase === "question" && after.phase !== "question") {
    const amount = Math.max(0, before.hp - after.hp);
    return {
      ...base,
      kind: amount ? "player" : "miss",
      amount,
      phaseShift:
        before.tactics?.mechanic === "echo" &&
        before.hp > before.maxHp / 2 &&
        after.hp <= before.maxHp / 2 &&
        after.hp > 0,
      special: amount
        ? before.finisher
          ? "limit"
          : after.breakFresh && !before.breakFresh
            ? "break"
            : before.tactics && before.skill === before.tactics.weakness
              ? "weakness"
              : undefined
        : undefined,
    };
  }
  if (
    after.turn > before.turn ||
    (before.phase !== "won" && after.phase === "won" && after.hp < before.hp)
  ) {
    if (after.phase === "won" && after.hp < before.hp)
      return { ...base, kind: "poison", amount: before.hp - after.hp };
    const intent = enemyIntent(
      { ...before, guarding: cause === "guard" },
      beforeSave,
      content,
    );
    return {
      ...base,
      kind: intent.kind === "recover" ? "recover" : "enemy",
      amount:
        cause === "evade"
          ? Math.max(0, beforeSave.character.hp - afterSave.character.hp)
          : intent.kind === "recover"
            ? Math.max(
                0,
                afterSave.character.focus - beforeSave.character.focus,
              )
            : intent.damage,
      heavy: intent.kind === "heavy",
      blocked:
        cause === "guard" ||
        cause === "evade" ||
        before.effects.some((e) => e.id === "shield"),
      special: before.breakFresh
        ? "break"
        : cause === "evade"
          ? "evade"
          : undefined,
    };
  }
  return null;
}

export function combatMotion(
  before: Battle,
  after: Battle,
): "player" | "enemy" | "miss" | null {
  if (
    after.turn > before.turn ||
    (before.phase === "feedback" && after.phase === "won")
  )
    return "enemy";
  if (before.phase === "question" && after.phase !== "question")
    return after.hp < before.hp ? "player" : "miss";
  return null;
}
