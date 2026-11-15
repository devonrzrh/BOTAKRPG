import { expect, it } from "vitest";
import { validateContent } from "../src/content/schema";
import raw from "../src/generated/content.json";
import { solvePuzzleForDebug } from "../src/game/debugPuzzle";
import { createPuzzle, puzzleCommand } from "../src/game/puzzles";

const puzzles = validateContent(raw).entities.flatMap((entry) =>
  entry.type === "activity" && entry.puzzle
    ? [{ id: entry.id, config: entry.puzzle }]
    : [],
);

it.each(puzzles)("solves $id with replayable debug commands", ({ config }) => {
  const initial = createPuzzle(config);
  const commands = solvePuzzleForDebug(config);
  const result = commands.reduce(puzzleCommand, initial);
  expect(result.solved).toBe(true);
  expect(result.moves).toBe(commands.length);
});
