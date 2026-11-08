import { describe, expect, it } from "vitest";
import {
  createPuzzle,
  puzzleCommand,
  puzzleConfigSchema,
  puzzleSolved,
  type PuzzleConfig,
  type PuzzleState,
} from "../src/game/puzzles";

const stackConfig: PuzzleConfig = {
  kind: "stack",
  values: [1, 2, 3, 4],
  target: [2, 1, 4, 3],
  budget: 8,
};
const queueConfig: PuzzleConfig = {
  kind: "queue",
  values: [41, 17, 93, 26],
  target: [93, 26, 41, 17],
  budget: 8,
};
const sortConfig: PuzzleConfig = {
  kind: "sorting",
  values: [4, 1, 3, 2],
  target: [1, 2, 3, 4],
  budget: 4,
};
const routeConfig: PuzzleConfig = {
  kind: "routing",
  values: [1, 2, 3, 4],
  target: [1, 4],
  budget: 6,
  edges: [
    { from: 1, to: 2, cost: 2 },
    { from: 2, to: 4, cost: 3 },
    { from: 1, to: 3, cost: 1 },
    { from: 3, to: 4, cost: 1 },
  ],
};

function act(
  state: PuzzleState,
  ...commands: Parameters<typeof puzzleCommand>[1][]
) {
  return commands.reduce(
    (current, command) => puzzleCommand(current, command),
    state,
  );
}

describe("detective learning puzzles", () => {
  it("solves the stack by pushing the next input and popping only the expected top", () => {
    const state = createPuzzle(stackConfig);
    const pushedThree = act(
      state,
      { type: "push" },
      { type: "push" },
      { type: "push" },
    );
    const rejected = puzzleCommand(pushedThree, { type: "pop" });
    expect(rejected.buffer).toEqual(pushedThree.buffer);
    expect(rejected.moves).toBe(pushedThree.moves);
    expect(rejected.message).toContain("target needs 2");
    const solved = act(
      state,
      { type: "push" },
      { type: "push" },
      { type: "pop" },
      { type: "pop" },
      { type: "push" },
      { type: "push" },
      { type: "pop" },
      { type: "pop" },
    );
    expect(puzzleSolved(solved)).toBe(true);
    expect(solved.output).toEqual(stackConfig.target);
  });

  it("rotates a queue and dispatches only matching heads", () => {
    const state = createPuzzle(queueConfig);
    const rotated = act(state, { type: "rotate" }, { type: "rotate" });
    expect(rotated.input).toEqual([93, 26, 41, 17]);
    const solved = act(
      rotated,
      ...queueConfig.target.map(() => ({ type: "dispatch" as const })),
    );
    expect(puzzleSolved(solved)).toBe(true);
    expect(solved.output).toEqual(queueConfig.target);
  });

  it("sorts through adjacent swaps in either direction", () => {
    const solved = act(
      createPuzzle(sortConfig),
      { type: "swap", index: 0 },
      { type: "swap", index: 1 },
      { type: "swap", index: 2 },
      { type: "swap", index: 1 },
    );
    expect(solved.input).toEqual(sortConfig.target);
    expect(puzzleSolved(solved)).toBe(true);
  });

  it("routes over undirected edges, allows cycles, and accounts for weighted cost", () => {
    const state = createPuzzle(routeConfig);
    const rejected = puzzleCommand(state, { type: "move", node: 4 });
    expect(rejected.route).toEqual([1]);
    const onCycle = act(
      state,
      { type: "move", node: 2 },
      { type: "move", node: 1 },
      { type: "move", node: 3 },
    );
    const solved = puzzleCommand(onCycle, { type: "move", node: 4 });
    expect(solved.route).toEqual([1, 2, 1, 3, 4]);
    expect(solved.cost).toBe(6);
    expect(puzzleSolved(solved)).toBe(true);
  });

  it("rejects inapplicable actions and does not spend moves on invalid actions", () => {
    const state = createPuzzle(stackConfig);
    const emptyPop = puzzleCommand(state, { type: "pop" });
    expect(emptyPop.moves).toBe(0);
    expect(emptyPop.buffer).toEqual([]);
    const wrongAction = puzzleCommand(state, { type: "dispatch" });
    expect(wrongAction.moves).toBe(0);
    expect(wrongAction.input).toEqual(state.input);
  });

  it("stops at the action budget and reports exhaustion", () => {
    const config: PuzzleConfig = {
      kind: "sorting",
      values: [3, 2, 1],
      target: [1, 2, 3],
      budget: 3,
    };
    const state = act(
      createPuzzle(config),
      { type: "swap", index: 0 },
      { type: "swap", index: 0 },
      { type: "swap", index: 0 },
    );
    const exhausted = puzzleCommand(state, { type: "swap", index: 0 });
    expect(exhausted.moves).toBe(3);
    expect(exhausted.input).toEqual(state.input);
    expect(exhausted.message).toContain("exhausted");
  });

  it("validates targets, sorting budget, and route reachability", () => {
    expect(
      puzzleConfigSchema.safeParse({ ...stackConfig, target: [2, 3, 4, 5] })
        .success,
    ).toBe(false);
    expect(
      puzzleConfigSchema.safeParse({ ...sortConfig, budget: 1 }).success,
    ).toBe(false);
    expect(
      puzzleConfigSchema.safeParse({ ...routeConfig, budget: 1 }).success,
    ).toBe(false);
    expect(
      puzzleConfigSchema.safeParse({ ...routeConfig, target: [1, 9] }).success,
    ).toBe(false);
    expect(() =>
      createPuzzle({ ...sortConfig, budget: 1 } as PuzzleConfig),
    ).toThrow();
  });

  it("rejects impossible stack targets, insufficient queue moves, and duplicate route edges", () => {
    expect(
      puzzleConfigSchema.safeParse({
        kind: "stack",
        values: [1, 2, 3],
        target: [3, 1, 2],
        budget: 6,
      }).success,
    ).toBe(false);
    expect(
      puzzleConfigSchema.safeParse({
        kind: "queue",
        values: [1, 2, 3],
        target: [2, 1, 3],
        budget: 3,
      }).success,
    ).toBe(false);
    expect(
      puzzleConfigSchema.safeParse({
        ...routeConfig,
        edges: [...routeConfig.edges, { from: 2, to: 1, cost: 2 }],
      }).success,
    ).toBe(false);
    expect(
      puzzleConfigSchema.safeParse({ ...queueConfig, budget: 2.5 }).success,
    ).toBe(false);
  });

  it("starts an already sorted puzzle as solved", () => {
    const state = createPuzzle({
      kind: "sorting",
      values: [1, 2, 3],
      target: [1, 2, 3],
      budget: 1,
    });
    expect(puzzleSolved(state)).toBe(true);
    expect(state.message).toContain("already sorted");
  });

  it("finds a budget-feasible route even when an isolated node sorts before it", () => {
    const config: PuzzleConfig = {
      kind: "routing",
      values: [1, 99, 2, 3],
      target: [1, 3],
      budget: 2,
      edges: [
        { from: 1, to: 2, cost: 1 },
        { from: 2, to: 3, cost: 1 },
      ],
    };
    expect(puzzleConfigSchema.safeParse(config).success).toBe(true);
  });
});
