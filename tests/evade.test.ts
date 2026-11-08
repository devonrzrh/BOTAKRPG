import { describe, expect, it } from "vitest";
import {
  createEvade,
  evadeComplete,
  evadeSeed,
  hazardLane,
  stepEvade,
  EVADE_SPEED,
  EVADE_MIN_X,
  EVADE_MAX_X,
} from "../src/game/evade";

describe("evade activity model", () => {
  it("creates a deterministic set of three telegraphed lanes", () => {
    expect(createEvade(27)).toEqual(createEvade(27));
    expect(createEvade(27).hazards).toHaveLength(3);
    expect(createEvade(27).hazards.map(({ lane }) => lane)).not.toEqual(
      createEvade(28).hazards.map(({ lane }) => lane),
    );
  });

  it("varies geometry, timing and approach while keeping attacks reproducible", () => {
    const patterns = Array.from({ length: 20 }, (_, seed) => createEvade(seed));
    expect(new Set(patterns.map((state) => state.pattern)).size).toBe(5);
    expect(
      patterns.some((state) =>
        state.hazards.some((hazard) => hazard.kind === "gap"),
      ),
    ).toBe(true);
    expect(
      patterns.some((state) =>
        state.hazards.some((hazard) => hazard.startLane !== hazard.lane),
      ),
    ).toBe(true);
    expect(
      new Set(
        patterns.map((state) =>
          state.hazards.map((hazard) => hazard.at).join(","),
        ),
      ).size,
    ).toBeGreaterThan(1);
    const a = evadeSeed("mimic", 2, 17);
    expect(a).toBe(evadeSeed("mimic", 2, 17));
    expect(a).not.toBe(evadeSeed("warden", 2, 17));
    expect(a).not.toBe(evadeSeed("mimic", 3, 17));
    expect(a).not.toBe(evadeSeed("mimic", 2, 18));
    expect(createEvade(a)).toEqual(createEvade(a));
  });

  it("keeps a zero-hit path reachable at the actual player speed for every generated family", () => {
    for (let seed = 0; seed < 300; seed++) {
      const state = createEvade(seed);
      let reachable = [[240, 240]],
        elapsed = 0;
      for (const hazard of state.hazards) {
        const travel = EVADE_SPEED * (hazard.at - elapsed);
        const safe =
          hazard.kind === "gap"
            ? [[hazard.lane - hazard.width, hazard.lane + hazard.width]]
            : [
                [EVADE_MIN_X, hazard.lane - hazard.width - 0.001],
                [hazard.lane + hazard.width + 0.001, EVADE_MAX_X],
              ];
        reachable = reachable.flatMap(([from, to]) =>
          safe
            .map(([left, right]) => [
              Math.max(EVADE_MIN_X, left, from - travel),
              Math.min(EVADE_MAX_X, right, to + travel),
            ])
            .filter(([left, right]) => left <= right),
        );
        expect(
          reachable.length,
          `seed ${seed}, wave at ${hazard.at}`,
        ).toBeGreaterThan(0);
        elapsed = hazard.at;
      }
    }
  });

  it("uses the safe opening for pincer waves and the crossing lane for diagonal shots", () => {
    const pincer = createEvade(2),
      gap = pincer.hazards[0];
    expect(gap.kind).toBe("gap");
    const safe = stepEvade({ ...pincer, playerX: gap.lane }, gap.at, 0);
    const hit = stepEvade({ ...pincer, playerX: 24 }, gap.at, 0);
    expect(safe.collisions).toBe(0);
    expect(hit.collisions).toBe(1);
    const sweep = createEvade(1).hazards[0];
    expect(hazardLane(sweep, sweep.at - 0.55)).toBeCloseTo(sweep.startLane);
    expect(hazardLane(sweep, sweep.at)).toBeCloseTo(sweep.lane);
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
