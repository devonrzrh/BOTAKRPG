import type { Battle } from "./combat";

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
