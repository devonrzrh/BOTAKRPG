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
}
export const combatCueDuration = (reducedMotion: boolean) =>
  reducedMotion ? 200 : 900;

/** Visual events are derived from resolved actions, before XP can heal a level-up. */
export function battleCue(
  before: Battle,
  after: Battle,
  beforeSave: Save,
  afterSave: Save,
  content: Content,
  sequence: number,
  cause?: "guard" | "item",
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
  if (before.phase === "question" && after.phase !== "question") {
    const amount = Math.max(0, before.hp - after.hp);
    return { ...base, kind: amount ? "player" : "miss", amount };
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
        intent.kind === "recover"
          ? Math.max(0, afterSave.character.focus - beforeSave.character.focus)
          : intent.damage,
      heavy: intent.kind === "heavy",
      blocked:
        cause === "guard" || before.effects.some((e) => e.id === "shield"),
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
