import { useEffect, useRef, useState } from "react";
import type { Content } from "../content/schema";
import type { Battle } from "../game/combat";
import type { Save } from "../game/state";
import {
  battleChanges,
  battleFeedbackSnapshot,
  type BattleChange,
} from "../game/battleFeedback";

export interface VisibleBattleChange extends BattleChange {
  sequence: number;
  expires: number;
}

export function useBattleFeedback(
  battle: Battle,
  save: Save,
  content: Content,
) {
  const previous = useRef(battleFeedbackSnapshot(battle, save, content));
  const sequence = useRef(0);
  const [changes, setChanges] = useState<VisibleBattleChange[]>([]);
  useEffect(() => {
    const next = battleFeedbackSnapshot(battle, save, content);
    const events = battleChanges(previous.current, next);
    const switched =
      previous.current.enemyId !== next.enemyId ||
      (["won", "lost"].includes(previous.current.phase) &&
        next.phase === "choose" &&
        next.turn === 1);
    previous.current = next;
    if (switched) {
      setChanges([]);
      return;
    }
    if (!events.length) return;
    const now = performance.now();
    const additions = events.map((event) => ({
      ...event,
      sequence: ++sequence.current,
      expires: now + 3000,
    }));
    // Keep preceding attack results visible through automatic enemy turns.
    setChanges((current) => [
      ...current.filter(
        (event) =>
          event.expires > now &&
          (event.id !== "boost-selection" ||
            next.phase === "choose" ||
            next.phase === "question") &&
          !events.some((next) => next.id === event.id),
      ),
      ...additions,
    ]);
  }, [battle, save, content]);
  useEffect(() => {
    if (!changes.length) return;
    const timer = setTimeout(
      () =>
        setChanges((current) =>
          current.filter((event) => event.expires > performance.now()),
        ),
      Math.max(
        1,
        Math.min(...changes.map((event) => event.expires)) - performance.now(),
      ) + 1,
    );
    return () => clearTimeout(timer);
  }, [changes]);
  return changes;
}
