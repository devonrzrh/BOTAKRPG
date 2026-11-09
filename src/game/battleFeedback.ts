import type { Content } from "../content/schema";
import { bossReadout, enemyIntent, type Battle } from "./combat";
import type { Save } from "./state";

export interface BattleFeedbackSnapshot {
  enemyId: string;
  hp: number;
  enemyHp: number;
  focus: number;
  boost: number;
  spend: number;
  limit: number;
  resolve: number;
  staggered: boolean;
  weakness: string;
  phase: Battle["phase"];
  bossPhase: string;
  turn: number;
  intent: string;
  effects: Battle["effects"];
}
export interface BattleChange {
  id: string;
  target:
    | "health"
    | "enemy"
    | "focus"
    | "boost"
    | "limit"
    | "intent"
    | "effect"
    | "stance";
  tone: "gain" | "loss" | "notice";
  text: string;
  delta?: number;
  previous?: number;
}
export function battleFeedbackSnapshot(
  battle: Battle,
  save: Save,
  content: Content,
): BattleFeedbackSnapshot {
  const intent = enemyIntent(battle, save, content);
  const weakness = battle.weaknessKnown
    ? (content.entities.find(
        (e) => e.type === "skill" && e.id === battle.tactics?.weakness,
      )?.title ?? "")
    : "";
  return {
    enemyId: battle.enemyId,
    hp: save.character.hp,
    enemyHp: battle.hp,
    focus: save.character.focus,
    boost: battle.boost ?? 0,
    spend: battle.boostSpend ?? 0,
    limit: battle.limit ?? 0,
    resolve: battle.resolve ?? 0,
    staggered: Boolean(battle.staggered),
    weakness,
    phase: battle.phase,
    bossPhase: bossReadout(battle)?.phase ?? "",
    turn: battle.turn,
    intent: `${intent.label} · ${intent.damage} damage`,
    effects: battle.effects.map((effect) => ({ ...effect })),
  };
}

/** Describe actual model changes only; mounting, selecting a skill, and settings stay silent. */
export function battleChanges(
  before: BattleFeedbackSnapshot,
  after: BattleFeedbackSnapshot,
): BattleChange[] {
  if (
    before.enemyId !== after.enemyId ||
    (["won", "lost"].includes(before.phase) &&
      after.phase === "choose" &&
      after.turn === 1)
  )
    return [];
  const changes: BattleChange[] = [];
  const metric = (
    id: "health" | "enemy" | "focus" | "boost" | "limit",
    label: string,
    a: number,
    b: number,
  ) => {
    if (a === b) return;
    const delta = b - a;
    changes.push({
      id,
      target: id,
      tone: delta > 0 ? "gain" : "loss",
      delta,
      previous: a,
      text:
        id === "limit" && b === 100
          ? "Finisher ready"
          : `${label} ${delta > 0 ? "+" : "−"}${Math.abs(delta)}${id === "limit" ? "%" : ""}`,
    });
  };
  metric("health", "HP", before.hp, after.hp);
  metric("enemy", "Enemy HP", before.enemyHp, after.enemyHp);
  metric("focus", "Focus", before.focus, after.focus);
  metric("boost", "Boost", before.boost, after.boost);
  metric("limit", "Finisher", before.limit, after.limit);
  if (
    before.spend !== after.spend &&
    before.phase === "choose" &&
    after.phase === "choose"
  )
    changes.push({
      id: "boost-selection",
      target: "boost",
      tone: "notice",
      text: after.spend
        ? `Boost selected · +${after.spend * 25}% next hit`
        : "Boost cleared",
    });
  for (const effect of after.effects) {
    const prior = before.effects.find((e) => e.id === effect.id);
    const name = effect.id[0].toUpperCase() + effect.id.slice(1);
    if (
      !prior ||
      effect.remaining > prior.remaining ||
      effect.magnitude !== prior.magnitude
    )
      changes.push({
        id: `effect-${effect.id}`,
        target: "effect",
        tone: "gain",
        text: `${name} ${prior ? "renewed" : "applied"} · ${effect.remaining} turns`,
      });
    else if (effect.remaining === 1 && prior.remaining > 1)
      changes.push({
        id: `effect-${effect.id}`,
        target: "effect",
        tone: "notice",
        text: `${name} · last turn`,
      });
  }
  for (const effect of before.effects)
    if (!after.effects.some((e) => e.id === effect.id))
      changes.push({
        id: `effect-${effect.id}`,
        target: "effect",
        tone: "loss",
        text: `${effect.id[0].toUpperCase() + effect.id.slice(1)} expired`,
      });
  if (before.staggered !== after.staggered)
    changes.push({
      id: "stance",
      target: "stance",
      tone: "notice",
      text: after.staggered
        ? "Stance broken · response skipped"
        : "Break consumed · armor restored",
    });
  else if (before.resolve < after.resolve)
    changes.push({
      id: "stance",
      target: "stance",
      tone: "notice",
      text: `Break progress +${after.resolve - before.resolve}`,
    });
  if (!before.weakness && after.weakness)
    changes.push({
      id: "weakness",
      target: "stance",
      tone: "gain",
      text: `Weakness revealed · ${after.weakness}`,
    });
  if (before.bossPhase !== after.bossPhase && after.bossPhase)
    changes.push({
      id: "boss-phase",
      target: "stance",
      tone: "notice",
      text: `Enemy phase · ${after.bossPhase}`,
    });
  if (
    after.phase !== "won" &&
    after.phase !== "lost" &&
    (before.turn !== after.turn || before.intent !== after.intent)
  )
    changes.push({
      id: "intent",
      target: "intent",
      tone: "notice",
      text: `Next: ${after.intent}`,
    });
  return changes;
}
