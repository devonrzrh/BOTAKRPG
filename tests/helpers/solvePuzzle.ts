import { expect } from "vitest";
import type { Activity } from "../../src/content/schema";
import {
  createPuzzle,
  puzzleCommand,
  type PuzzleCommand,
} from "../../src/game/puzzles";

/** Exercise real commands, including intermediate validity, in campaign replay tests. */
export function solvePuzzle(activity: Activity) {
  const config = activity.puzzle!;
  let state = createPuzzle(config);
  const commands: PuzzleCommand[] = [];
  const act = (command: PuzzleCommand) => {
    const next = puzzleCommand(state, command);
    expect(next.moves, next.message).toBe(state.moves + 1);
    state = next;
    commands.push(command);
  };
  if (config.kind === "sorting") {
    while (!state.solved) {
      const index = state.input.findIndex((v, i) => v > state.input[i + 1]);
      if (index < 0) throw new Error(activity.id);
      act({ type: "swap", index });
    }
  } else if (config.kind === "search") {
    while (!state.solved)
      act({ type: "probe", index: Math.floor((state.low + state.high) / 2) });
  } else if (config.kind === "stack") {
    for (const value of config.target) {
      while (state.buffer.at(-1) !== value) act({ type: "push" });
      act({ type: "pop" });
    }
  } else if (config.kind === "queue") {
    for (const value of config.target) {
      while (state.input[0] !== value) act({ type: "rotate" });
      act({ type: "dispatch" });
    }
  } else if (config.kind === "hanoi") {
    const transfer = (
      count: number,
      from: number,
      to: number,
      spare: number,
    ) => {
      if (!count) return;
      transfer(count - 1, from, spare, to);
      act({ type: "transfer", from, to });
      transfer(count - 1, spare, to, from);
    };
    transfer(config.values.length, 0, 2, 1);
  } else {
    const pending = [
      { node: config.target[0], cost: 0, route: [] as number[] },
    ];
    const seen = new Set<number>();
    while (pending.length) {
      pending.sort((a, b) => a.cost - b.cost);
      const path = pending.shift()!;
      if (seen.has(path.node)) continue;
      seen.add(path.node);
      if (path.node === config.target[1]) {
        for (const node of path.route) act({ type: "move", node });
        break;
      }
      for (const edge of config.edges) {
        const node =
          edge.from === path.node
            ? edge.to
            : edge.to === path.node
              ? edge.from
              : undefined;
        if (node !== undefined)
          pending.push({
            node,
            cost: path.cost + edge.cost,
            route: [...path.route, node],
          });
      }
    }
  }
  expect(state.solved, activity.id).toBe(true);
  return commands;
}
