import { describe, expect, it } from "vitest";
import {
  createPuzzle,
  puzzleCommand,
  puzzleConfigSchema,
  type PuzzleConfig,
} from "../src/game/puzzles";

const search: PuzzleConfig = {
  kind: "search",
  values: [4, 9, 15, 22, 31, 43, 58],
  target: [43],
  budget: 3,
};
const hanoi: PuzzleConfig = {
  kind: "hanoi",
  values: [3, 2, 1],
  target: [3, 2, 1],
  budget: 7,
};

describe("binary search archive", () => {
  it("narrows the range using comparisons and reveals only probed slots", () => {
    const initial = createPuzzle(search);
    const low = puzzleCommand(initial, { type: "probe", index: 3 });
    expect(low.low).toBe(4);
    expect(low.high).toBe(6);
    expect(low.probes).toEqual([3]);
    expect(initial.probes).toEqual([]);
    const high = puzzleCommand(low, { type: "probe", index: 6 });
    expect(high.high).toBe(5);
    const found = puzzleCommand(high, { type: "probe", index: 5 });
    expect(found.solved).toBe(true);
    expect(found.moves).toBe(3);
    expect(puzzleCommand(found, { type: "probe", index: 4 }).moves).toBe(3);
  });

  it("rejects excluded, fractional and out-of-range slots without consuming probes", () => {
    const state = puzzleCommand(createPuzzle(search), {
      type: "probe",
      index: 3,
    });
    for (const index of [-1, 0, 3, 4.5, 99, NaN]) {
      const rejected = puzzleCommand(state, { type: "probe", index });
      expect(rejected.moves).toBe(1);
      expect(rejected.probes).toEqual([3]);
    }
  });

  it("exhausts a poor search and validates sorted unique values and feasible budgets", () => {
    let state = createPuzzle(search);
    for (const index of [0, 1, 2])
      state = puzzleCommand(state, { type: "probe", index });
    expect(state.solved).toBe(false);
    expect(puzzleCommand(state, { type: "probe", index: 5 }).moves).toBe(3);
    for (const config of [
      { ...search, values: [9, 4, 15] },
      { ...search, values: [4, 4, 43] },
      { ...search, target: [44] },
      { ...search, target: [43, 58] },
      { ...search, budget: 1 },
    ])
      expect(puzzleConfigSchema.safeParse(config).success).toBe(false);
  });
});

describe("recursive transfer lock", () => {
  it("moves only top discs and rejects large-on-small transfers without mutation", () => {
    const initial = createPuzzle(hanoi);
    const moved = puzzleCommand(initial, { type: "transfer", from: 0, to: 2 });
    expect(initial.pegs).toEqual([[3, 2, 1], [], []]);
    expect(moved.pegs).toEqual([[3, 2], [], [1]]);
    for (const command of [
      { type: "transfer" as const, from: 0, to: 2 },
      { type: "transfer" as const, from: 1, to: 0 },
      { type: "transfer" as const, from: 0, to: 0 },
      { type: "transfer" as const, from: -1, to: 2 },
      { type: "transfer" as const, from: 0, to: 2.5 },
    ]) {
      const rejected = puzzleCommand(moved, command);
      expect(rejected.moves).toBe(1);
      expect(rejected.pegs).toEqual(moved.pegs);
    }
  });

  it("releases the lock only when all discs reach peg 3", () => {
    let state = createPuzzle(hanoi);
    for (const [from, to] of [
      [0, 2],
      [0, 1],
      [2, 1],
      [0, 2],
      [1, 0],
      [1, 2],
      [0, 2],
    ]) {
      expect(state.solved).toBe(false);
      state = puzzleCommand(state, { type: "transfer", from, to });
    }
    expect(state.pegs).toEqual([[], [], [3, 2, 1]]);
    expect(state.solved).toBe(true);
    expect(state.moves).toBe(7);
  });

  it("validates descending positive discs, fixed target and minimum budget", () => {
    for (const config of [
      { ...hanoi, values: [1, 2, 3] },
      { ...hanoi, values: [3, 2, 0] },
      { ...hanoi, values: [3, 2, 2] },
      { ...hanoi, target: [1, 2, 3] },
      { ...hanoi, budget: 6 },
      {
        ...hanoi,
        values: [6, 5, 4, 3, 2, 1],
        target: [6, 5, 4, 3, 2, 1],
        budget: 63,
      },
    ])
      expect(puzzleConfigSchema.safeParse(config).success).toBe(false);
  });
});
