import { describe, expect, it } from "vitest";
import { createBattle } from "../src/game/combat";
import type { BattleCue } from "../src/game/combatPresentation";
import {
  enemyDialogue,
  enemySpeechEvent,
  type EnemySpeechEvent,
} from "../src/game/enemyDialogue";

const cue = (overrides: Partial<BattleCue> = {}): BattleCue => ({
  sequence: 1,
  kind: "player",
  skill: null,
  amount: 12,
  heavy: false,
  blocked: false,
  defeated: false,
  ...overrides,
});
const ids = [
  "sentinel",
  "guard-source-alg-01",
  "guard-source-ds-01",
  "guard-source-ai-01",
  "archive-keeper",
  "routing-warden",
  "signal-mimic",
  "echo-7",
];
const events: EnemySpeechEvent[] = [
  "intro",
  "idle",
  "attack",
  "hurt",
  "lowHealth",
  "miss",
  "defeated",
  "victorious",
  "pacified",
  "phaseShift",
];

describe("enemy personality", () => {
  it("gives every silhouette a distinct voice and short lines for every event", () => {
    for (const event of events) {
      const lines = ids.map((id) => enemyDialogue(id, event));
      expect(new Set(lines).size).toBe(ids.length);
      for (const line of lines) expect(line.length).toBeLessThanOrEqual(52);
    }
    expect(enemyDialogue("unknown", "intro")).toBe(
      enemyDialogue("sentinel", "intro"),
    );
    expect(enemyDialogue("echo-7", "attack", 1)).not.toBe(
      enemyDialogue("echo-7", "attack", 2),
    );
  });
  it("prioritizes resolved encounters and phase changes over normal reactions", () => {
    const battle = createBattle();
    expect(enemySpeechEvent({ ...battle, phase: "won", hp: 0 }, cue())).toBe(
      "defeated",
    );
    expect(
      enemySpeechEvent(
        { ...battle, phase: "won", resolution: "pacified" },
        cue(),
      ),
    ).toBe("pacified");
    expect(
      enemySpeechEvent({ ...battle, phase: "lost" }, cue({ kind: "enemy" })),
    ).toBe("victorious");
    expect(enemySpeechEvent(battle, cue({ phaseShift: true }))).toBe(
      "phaseShift",
    );
  });
  it("reacts to attacks, mistakes and damage without treating recovery as damage", () => {
    const battle = createBattle();
    expect(enemySpeechEvent(battle, cue({ kind: "enemy" }))).toBe("attack");
    expect(enemySpeechEvent(battle, cue({ kind: "miss" }))).toBe("miss");
    expect(enemySpeechEvent(battle, cue())).toBe("hurt");
    expect(enemySpeechEvent(battle, cue({ kind: "recover" }))).toBeNull();
    expect(enemySpeechEvent(battle, cue({ amount: 0 }))).toBeNull();
    expect(enemySpeechEvent(battle, null)).toBeNull();
    expect(enemySpeechEvent({ ...battle, hp: 10 }, cue())).toBe("lowHealth");
    expect(enemySpeechEvent({ ...battle, hp: 10 }, cue(), true)).toBe("hurt");
  });
});
