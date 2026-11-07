import { describe, expect, it } from "vitest";
import { createEvade, evadeComplete, stepEvade } from "../src/game/evade";

describe("evade activity model", () => {
  it("creates a deterministic set of three telegraphed lanes", () => {
    expect(createEvade(27)).toEqual(createEvade(27));
    expect(createEvade(27).hazards).toHaveLength(3);
    expect(createEvade(27).hazards.map(({ lane }) => lane)).not.toEqual(
      createEvade(28).hazards.map(({ lane }) => lane),
    );
  });

  it("keeps movement bounded and produces the same result across frame partitions", () => {
    let coarse = createEvade(9),
      fine = createEvade(9);
    for (let i = 0; i < 28; i++)
      coarse = stepEvade(coarse, 0.1, i < 14 ? 1 : -1);
    for (let i = 0; i < 280; i++)
      fine = stepEvade(fine, 0.01, i < 140 ? 1 : -1);
    expect(fine.elapsed).toBeCloseTo(coarse.elapsed, 5);
    expect(fine.playerX).toBeCloseTo(coarse.playerX, 5);
    expect(fine.collisions).toBe(coarse.collisions);
    expect(coarse.playerX).toBeGreaterThanOrEqual(24);
    expect(coarse.playerX).toBeLessThanOrEqual(456);
  });

  it("sweeps crossings and counts each hazard at most once", () => {
    const initial = createEvade(1);
    const state = { ...initial, playerX: initial.hazards[0].lane };
    const after = stepEvade(state, 2.8, 0);
    expect(after.collisions).toBeLessThanOrEqual(3);
    expect(after.hazards.filter((hazard) => hazard.resolved)).toHaveLength(3);
    expect(stepEvade(after, 1, 0)).toBe(after);
  });

  it("finishes exactly at the activity duration", () => {
    expect(evadeComplete(stepEvade(createEvade(2), 2.79, 0))).toBe(false);
    expect(evadeComplete(stepEvade(createEvade(2), 2.8, 0))).toBe(true);
  });
});
