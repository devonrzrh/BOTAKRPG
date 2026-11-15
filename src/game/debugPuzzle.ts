import {
  createPuzzle,
  puzzleCommand,
  shortestPuzzleRoute,
  type PuzzleCommand,
  type PuzzleConfig,
} from "./puzzles";

export function solvePuzzleForDebug(config: PuzzleConfig): PuzzleCommand[] {
  let state = createPuzzle(config);
  const commands: PuzzleCommand[] = [];
  const act = (command: PuzzleCommand) => {
    const next = puzzleCommand(state, command);
    if (next.moves === state.moves) throw new Error(next.message);
    commands.push(command);
    state = next;
  };

  switch (config.kind) {
    case "stack":
      for (const value of config.target) {
        while (state.buffer.at(-1) !== value) act({ type: "push" });
        act({ type: "pop" });
      }
      break;
    case "queue":
      for (const value of config.target) {
        while (state.input[0] !== value) act({ type: "rotate" });
        act({ type: "dispatch" });
      }
      break;
    case "sorting":
      for (let end = state.input.length - 1; end > 0 && !state.solved; end--)
        for (let index = 0; index < end && !state.solved; index++)
          if (state.input[index] > state.input[index + 1])
            act({ type: "swap", index });
      break;
    case "search":
      while (!state.solved)
        act({ type: "probe", index: Math.floor((state.low + state.high) / 2) });
      break;
    case "routing": {
      const [start, goal] = config.target;
      const { path } = shortestPuzzleRoute(config.values, config.edges, start, goal);
      path.forEach((node) => act({ type: "move", node }));
      break;
    }
    case "hanoi": {
      const transfer = (size: number, from: number, to: number, spare: number) => {
        if (!size) return;
        transfer(size - 1, from, spare, to);
        act({ type: "transfer", from, to });
        transfer(size - 1, spare, to, from);
      };
      transfer(config.values.length, 0, 2, 1);
      break;
    }
  }

  if (!state.solved) throw new Error("Puzzle solver did not reach the target.");
  return commands;
}
